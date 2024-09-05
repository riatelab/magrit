// Imports from solid-js
import {
  type Accessor,
  type JSX,
  onCleanup,
  onMount,
  Show,
} from 'solid-js';
import { Portal } from 'solid-js/web';

// Imports from other packages
import initGdalJs from 'gdal3.js';
import workerUrl from 'gdal3.js/dist/package/gdal3.js?url'; // eslint-disable-line import/extensions
import dataUrl from 'gdal3.js/dist/package/gdal3WebAssembly.data?url';
import wasmUrl from 'gdal3.js/dist/package/gdal3WebAssembly.wasm?url';
import { Transition } from 'solid-transition-group';
import toast, { Toaster } from 'solid-toast';
import { yieldOrContinue } from 'main-thread-scheduling';

// Helpers
import { useI18nContext } from './i18n/i18n-solid';
import { isLocale } from './i18n/i18n-util';
import { loadLocale } from './i18n/i18n-util.sync';
import { toggleDarkMode } from './helpers/darkmode';
import { clickLinkFromBlob } from './helpers/exports';
import { draggedElementsAreFiles, droppedElementsAreFiles, prepareFilterAndStoreFiles } from './helpers/fileUpload';
import { round } from './helpers/math';
import parseQueryString from './helpers/query-string';
import { initDb, storeProject } from './helpers/storage';
import { isValidProject, patchProject, ValidityState } from './helpers/project';

// Sub-components
import AboutModal from './components/Modals/AboutModal.tsx';
import DefaultModal from './components/Modals/ModalWindow.tsx';
import LeftMenu from './components/LeftMenu/LeftMenu.tsx';
import LoadingOverlay from './components/LoadingOverlay.tsx';
import MapZone from './components/MapZone.tsx';
import NiceAlert from './components/Modals/NiceAlert.tsx';
import TableWindow from './components/Modals/TableWindow.tsx';
import ClassificationPanel from './components/Modals/ClassificationPanel.tsx';
import ClassificationDiscontinuityPanel from './components/Modals/ClassificationDiscontinuityPanel.tsx';
import HeaderBarApp from './components/Headers.tsx';
import ContextMenu from './components/ContextMenu.tsx';
import ImportWindow from './components/ImportWindow.tsx';
import InfoFeatureBox from './components/InfoFeatureBox.tsx';
import FunctionalitySelection from './components/Modals/FunctionalitySelection.tsx';
import TableFunctionalitySelection from './components/Modals/TableFunctionalitySelection.tsx';
import { setGdalLoaded } from './components/LeftMenu/gdalLoadingStatus';

// Stores
import { classificationPanelStore } from './store/ClassificationPanelStore';
import {
  globalStore, setGlobalStore, setLoading, setReloadingProject,
} from './store/GlobalStore';
import {
  mapStore,
  setMapStoreBase,
} from './store/MapStore';
import {
  layersDescriptionStore,
  setLayersDescriptionStore,
} from './store/LayersDescriptionStore';
import { modalStore, setModalStore } from './store/ModalStore';
import { niceAlertStore, setNiceAlertStore } from './store/NiceAlertStore';
import { fileDropStore, setFileDropStore } from './store/FileDropStore';
import { tableWindowStore } from './store/TableWindowStore';
import {
  applicationSettingsStore,
  ResizeBehavior,
  setApplicationSettingsStore,
} from './store/ApplicationSettingsStore';
import { contextMenuStore } from './store/ContextMenuStore';
import { undo, redo } from './store/undo-redo';
import { functionalitySelectionStore } from './store/FunctionalitySelectionStore';

// Types and enums
import {
  DexieDb,
  ProjectDescription,
} from './global';
import type { TranslationFunctions } from './i18n/i18n-types';

// Styles
import './styles/Transitions.css';

// Are we in electron ?
// Currently we need this for:
// - the path to the data and wasm files(gdal3.js)
// - the beforeunload event
const isElectron = navigator.userAgent.toLowerCase().indexOf(' electron/') > -1;

const loadGdal = async (): Promise<Gdal> => initGdalJs({
  paths: {
    // We need a workaround to make it works the same way on electron
    // and in the browser (otherwise we get a double 'file:///' in the URL)
    wasm: isElectron ? wasmUrl.replace('file:///', '') : wasmUrl,
    data: isElectron ? dataUrl.replace('file:///', '') : dataUrl,
    js: workerUrl,
  },
  useWorker: true,
});

let timeout: NodeJS.Timeout | null | undefined = null;

const db = initDb() as DexieDb;

const prepareExportProject = (): ProjectDescription => {
  // The current version of the application
  const { version } = globalStore;
  // The state of the current project (layers, tables and layout features)
  const { layers, layoutFeaturesAndLegends, tables } = layersDescriptionStore;
  // The state of the map
  const map = { ...mapStore };
  // The application settings
  const applicationSettings = { ...applicationSettingsStore };
  return {
    version,
    applicationSettings,
    layers,
    layoutFeaturesAndLegends,
    map,
    tables,
  };
};

const onBeforeUnloadWindow = (ev: Event) => {
  // If there is no layer or if
  // there is only the sphere layer and or the graticule layer,
  // do nothing
  if (!globalStore.userHasAddedLayer) {
    return;
  }

  // This is to prevent the browser from closing the window (or tab)
  // by displaying a confirmation dialog.
  // Note that in electron, any non-undefined value will prevent the window from closing
  // without showing any dialog.
  if (!isElectron) {
    ev.returnValue = false; // eslint-disable-line no-param-reassign
  }

  // Otherwise we store the state of the current projet
  // in the local DB (indexedDB via Dexie)
  const projectObj = prepareExportProject();
  storeProject(db, projectObj);
};

const dragEnterHandler = (e: Event): void => {
  e.preventDefault();
  e.stopPropagation();

  // Only files should trigger the opening of the drop overlay
  if (!draggedElementsAreFiles(e as DragEvent)) return;
  // We dont want the user to be able to drop files while a project is reloading
  if (globalStore.isReloadingProject) return;

  setFileDropStore({ show: true });
  // clearTimeout(timeout);
};

const dragOverHandler = (e: Event): void => {
  e.preventDefault();
  e.stopPropagation();

  // Only files should trigger the opening of the drop overlay
  if (!draggedElementsAreFiles(e as DragEvent)) return;
  // We dont want the user to be able to drop files while a project is reloading
  if (globalStore.isReloadingProject) return;

  setFileDropStore({ show: true });
  if (timeout) {
    clearTimeout(timeout);
    // timeout = setTimeout(() => {
    //   setOverlayDropStore({ show: false });
    //   timeout = null;
    // }, 2500);
  }
};

const dragLeaveHandler = (e: Event): void => {
  e.preventDefault();
  e.stopPropagation();

  // Only files should trigger the opening of the drop overlay
  if (!draggedElementsAreFiles(e as DragEvent)) return;
  // We dont want the user to be able to drop files while a project is reloading
  if (globalStore.isReloadingProject) return;

  // We want the drop overlay to close if the cursor leaves the drop area
  // and there are no files in the drop area
  timeout = setTimeout(() => {
    if (fileDropStore.files.length < 1) {
      setFileDropStore({ show: false, files: [] });
      timeout = null;
    }
  }, 1000);
};

const dropHandler = (e: Event, LL: Accessor<TranslationFunctions>): void => {
  e.preventDefault();
  e.stopPropagation();

  // We dont want the user to be able to drop files while a project is reloading
  if (globalStore.isReloadingProject) return;

  // Only files should trigger the opening of the drop overlay
  const draggedElementsStatus = droppedElementsAreFiles(e as DragEvent);
  if (!draggedElementsStatus.isFiles) {
    if (draggedElementsStatus.reason === 'directory' || draggedElementsStatus.reason === 'emptyFiles') {
      toast.error(LL().ImportWindow.InstructionNotFolder());
    }
    setFileDropStore({ show: false, files: [] });
    return;
  }

  // Store the supported files in the fileDropStore
  // and display a toast message for the unsupported files
  const unsupportedFiles = prepareFilterAndStoreFiles(
    (e as DragEvent).dataTransfer!.files,
    fileDropStore,
    setFileDropStore,
  );

  unsupportedFiles.forEach((file) => {
    toast.error(LL().ImportWindow.UnsupportedFileFormat({ file }));
  });

  if (fileDropStore.files.length === 0) {
    // All the files are unsupported
    setFileDropStore({ show: false });
  }

  if (timeout) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      // setFileDropStore({ show: false, files: [] });
      timeout = null;
    }, 500);
  }
};

const reloadFromProjectObject = async (
  obj: ProjectDescription,
  LL: Accessor<TranslationFunctions>,
): Promise<void> => {
  // Set the app in "reloading" mode
  // (it displays a loading overlay and prevents the user from adding new layers
  // it  also set a flag the enable restoring the extent of the map
  // - more details in store/MapStore.ts)
  setReloadingProject(true);

  await yieldOrContinue('smooth');

  // Read the project and detect if it is valid or
  // if it was saved with a newer version of the application
  const projectValidityState = isValidProject(obj);
  if (projectValidityState === ValidityState.Invalid) {
    setReloadingProject(false);
    setNiceAlertStore({
      show: true,
      type: 'error',
      content: () => <div>
        <h4>{LL().Alerts.InvalidProject()}</h4>
      </div>,
      focusOn: 'confirm',
    });
    return;
  }
  if (projectValidityState === ValidityState.SavedFromNewerVersion) {
    setReloadingProject(false);
    setNiceAlertStore({
      show: true,
      type: 'error',
      content: () => <div>
        <h4>{LL().Alerts.ProjectSavedWithNewerVersion()}</h4>
      </div>,
      focusOn: 'confirm',
    });
    return;
  }

  // Get the different parts of the project
  // after applying the necessary patches
  // for making it compatible with the current version of the application
  // if necessary.
  const {
    version,
    applicationSettings,
    layers,
    layoutFeaturesAndLegends,
    map,
    tables,
  } = patchProject(obj);

  // Reset the application settings store
  setApplicationSettingsStore(applicationSettings);
  // Reset the layers description store before changing the map store
  // (this avoid redrawing the map for the potential current layers)
  setLayersDescriptionStore({ layers: [], layoutFeaturesAndLegends: [], tables: [] });
  // Update the layer description store with the layers and layout features
  setLayersDescriptionStore({ layers, layoutFeaturesAndLegends, tables });
  // Update the map store
  // (this updates the projection and pathGenerator in the global store)
  setMapStoreBase(map);
  // Reverse the "userHasAddedLayer" flag
  setGlobalStore({ userHasAddedLayer: true });
  // Hide the loading overlay
  setReloadingProject(false);
};

const projectFromQueryString = async (): Promise<ProjectDescription | undefined> => {
  let projectDefinition;
  if (window.location.search) {
    const qs = parseQueryString(window.location.search);
    const reloadUrl = qs.reload.startsWith('http') ? qs.reload : undefined;
    if (typeof (window.history.replaceState) !== 'undefined') {
      // replaceState should avoid creating a new entry on the history
      const obj = {
        Page: window.location.search,
        Url: window.location.pathname,
      };
      window.history.replaceState(obj, obj.Page, obj.Url);
    }
    if (reloadUrl) {
      const response = await fetch(reloadUrl);
      if (response.ok) {
        const project = await response.json();
        projectDefinition = project;
      }
    }
  }
  return projectDefinition;
};

const AppPage: () => JSX.Element = () => {
  const { setLocale, LL } = useI18nContext();
  // Do we have a selected langage stored in the local storage ?
  const prefLang = localStorage.getItem('selected-lang');
  // Read the user locale from the application settings store
  // and split the locale to get the language only
  const browserLang = applicationSettingsStore.userLocale.split('-')[0];
  // The user language is the last selected language if it is available
  // in the list of available locales, otherwise it is the browser language
  const userLanguage = prefLang && isLocale(prefLang) ? prefLang : browserLang;
  // Is it available in the list of available locales ?
  if (isLocale(userLanguage)) {
    loadLocale(userLanguage);
    // If yes, set the locale
    setLocale(userLanguage);
  } else {
    // If not, set the default locale
    setLocale('en');
  }

  // Set the maximum dimensions of the map for the current window size
  // (we need it before mounting the component because the map is
  // created when the component is mounted and the map uses mapStore.mapDimensions)
  const maxMapDimensions = {
    width: round((window.innerWidth - globalStore.leftMenuWidth) * 0.9, 0),
    height: round((window.innerHeight - globalStore.headerHeight) * 0.9, 0),
  };

  setMapStoreBase({
    mapDimensions: maxMapDimensions,
  });

  // Store some useful values in the global store
  setGlobalStore({
    windowDimensions: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
  });

  const onResize = (/* event: Event */): void => {
    // Store new dimensions of the window and size of header / left menu
    const width = window.innerWidth;
    const height = window.innerHeight;
    setGlobalStore({
      windowDimensions: {
        width,
        height,
      },
      headerHeight: +(getComputedStyle(document.documentElement).getPropertyValue('--header-height').replace('px', '')),
      leftMenuWidth: +(getComputedStyle(document.documentElement).getPropertyValue('--left-menu-width').replace('px', '')),
    });

    // Resize (or not) the map according to the resize behavior
    if (applicationSettingsStore.resizeBehavior === ResizeBehavior.ShrinkGrow) {
      // Store the new dimensions of the map
      setMapStoreBase({
        mapDimensions: {
          width: Math.round((width - globalStore.leftMenuWidth) * 0.9),
          height: Math.round((height - globalStore.headerHeight) * 0.9),
        },
      });

      // Note that the clipExtent is automatically updated (in MapStore)
      // and that the path are automatically updated (triggered from MapStore too)
    } else if (applicationSettingsStore.resizeBehavior === ResizeBehavior.KeepMapSize) {
      // Do nothing (at least for now)
    }
  };

  onCleanup(() => {
    // When app is unmounted, remove event listeners
    window.removeEventListener('resize', onResize);
    window.removeEventListener('beforeunload', onBeforeUnloadWindow);
  });

  // Todo: there is a lot of code executed in onMount,
  //  it should be refactored / split into smaller functions
  onMount(async () => {
    // Load GDAL
    // TODO: we should handle the case where gdal isn't fully loaded yet but the user
    //  tries to use it (for example by dropping a file...)
    loadGdal().then((gdal) => {
      // @ts-expect-error - we should fix the type of globalThis.gdal
      globalThis.gdal = gdal;
      setGdalLoaded(true);
    });

    // Add event listener to the window to handle resize events
    window.addEventListener('resize', onResize);

    // Add event listeners to the root element and the overlay drop
    // in order to handle drag and drop events (for files upload only)
    document.querySelectorAll('div#root, .overlay-drop')
      .forEach((el) => {
        el.addEventListener('dragenter', dragEnterHandler);
        el.addEventListener('dragover', dragOverHandler);
        el.addEventListener('dragleave', dragLeaveHandler);
        el.addEventListener('drop', (e) => dropHandler(e, LL));
      });

    // Add event listener to the window to handle beforeunload events
    window.addEventListener('beforeunload', onBeforeUnloadWindow);

    // Add event listener to handle undo/redo events
    document.getElementById('button-undo')
      ?.addEventListener('click', undo);
    document.getElementById('button-redo')
      ?.addEventListener('click', redo);

    // Add event listener to handle the light / dark mode
    document.getElementById('toggle-night-day')
      ?.addEventListener('click', toggleDarkMode);

    // Event listeners for the buttons of the header bar
    document.getElementById('button-new-project')
      ?.addEventListener('click', () => {
        const createNewProject = (): void => {
          window.removeEventListener('beforeunload', onBeforeUnloadWindow);
          document.location.reload();
        };

        setNiceAlertStore({
          show: true,
          content: () => <div
              class="is-flex is-justify-content-center is-align-items-center"
              style={{ height: '100%' }}
            >
              <h4>{ LL().Alerts.EmptyProject() }</h4>
            </div>,
          confirmCallback: createNewProject,
          focusOn: 'confirm',
        });
      });

    document.getElementById('button-export-project')
      ?.addEventListener('click', async () => {
        setLoading(true, 'ExportPreparation');
        await yieldOrContinue('interactive');
        const projectObj = prepareExportProject();
        const serializedProject = JSON.stringify(projectObj, null, 0);
        const blob = new Blob([serializedProject], { type: 'application/json' });
        return clickLinkFromBlob(blob, 'export-project.mjson')
          .finally(() => {
            setLoading(false);
          });
      });

    document.getElementById('button-import-project')
      ?.addEventListener('click', () => {
        const elem = document.createElement('input');
        elem.type = 'file';
        elem.accept = '.mjson';
        elem.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result;
            if (!result) return;
            const obj = JSON.parse(result.toString());
            reloadFromProjectObject(obj, LL);
          };
          reader.readAsText(file);
        };
        elem.click();
      });

    document.getElementById('button-about-magrit')
      ?.addEventListener('click', () => {
        setModalStore({
          show: true,
          title: LL().AboutAndSettingsPanel.title(),
          escapeKey: 'confirm',
          content: () => AboutModal({
            LL,
            version: globalStore.version,
          }),
          width: '660px',
        });
      });
    // Is there a project in the query string ?
    const projectQs = await projectFromQueryString();
    if (projectQs) {
      reloadFromProjectObject(projectQs, LL);
    } else {
      // If not, we check if there is a project in the local DB
      const projects = await db.projects.toArray();
      // If there is a project, propose to reload it
      if (projects.length > 0) {
        const { date, data } = projects[0];
        setNiceAlertStore({
          show: true,
          content: () => <p>{LL().Alerts.ReloadLastProject(date.toLocaleDateString())}</p>,
          confirmCallback: () => {
            setGlobalStore({ userHasAddedLayer: true });
            reloadFromProjectObject(data, LL);
          },
          focusOn: 'confirm',
        });
      }
    }
    // We only keep the last project in the DB
    // so at this point we can delete all projects
    db.projects.clear();
  });

  return <>
    <HeaderBarApp />
    <main>
      <LeftMenu />
      <MapZone />
      <Show when={globalStore.isLoading }>
        <LoadingOverlay />
      </Show>
      <Transition name="slide-fade">
        <Show when={functionalitySelectionStore.show && functionalitySelectionStore.type === 'layer'}>
          <FunctionalitySelection />
        </Show>
        <Show when={functionalitySelectionStore.show && functionalitySelectionStore.type === 'table'}>
          <TableFunctionalitySelection />
        </Show>
      </Transition>
      <Transition name="slide-fade">
        <Show when={classificationPanelStore.show && classificationPanelStore.type! === 'color'}>
          <ClassificationPanel />
        </Show>
        <Show when={classificationPanelStore.show && classificationPanelStore.type! === 'size'}>
          <ClassificationDiscontinuityPanel />
        </Show>
        <Show when={tableWindowStore.show}>
          <TableWindow />
        </Show>
        <Show when={modalStore.show}>
          <DefaultModal />
        </Show>
      </Transition>
      <Show when={fileDropStore.show}>
        <ImportWindow />
      </Show>
      {/*
        We put the NiceAlert component outside of the previous Transition component
        and we put it lower than it in the DOM
        because we want it to be displayed on top of the other modals
        (for example when asking for confirmation when closing
        the table modal after having made changes)
      */}
      <Transition name="slide-fade">
        <Show when={niceAlertStore.show}>
          <NiceAlert />
        </Show>
      </Transition>
      <Show when={contextMenuStore.show}>
        <ContextMenu />
      </Show>
    </main>
    <Show when={globalStore.isInfo}>
      <Portal>
        <InfoFeatureBox />
      </Portal>
    </Show>
    <Toaster position={'bottom-center'} />
  </>;
};

export default AppPage;
