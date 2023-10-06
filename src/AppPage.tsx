// Imports from solid-js
import {
  JSX, onCleanup, onMount, Show,
} from 'solid-js';

// Imports from other packages
import initGdalJs from 'gdal3.js';
import workerUrl from 'gdal3.js/dist/package/gdal3.js?url'; // eslint-disable-line import/extensions
import dataUrl from 'gdal3.js/dist/package/gdal3WebAssembly.data?url';
import wasmUrl from 'gdal3.js/dist/package/gdal3WebAssembly.wasm?url';
import { Transition } from 'solid-transition-group';
import { Toaster } from 'solid-toast';
import { Dexie } from 'dexie';

// Helpers
import { useI18nContext } from './i18n/i18n-solid';
import d3 from './helpers/d3-custom';
import { clickLinkFromDataUrl } from './helpers/exports';
import { draggedElementsAreFiles, prepareFileExtensions } from './helpers/fileUpload';
import { round } from './helpers/math';

// Sub-components
import FieldTypingModal from './components/Modals/FieldTypingModal.tsx';
import DefaultModal from './components/Modals/ModalWindow.tsx';
import LeftMenu from './components/LeftMenu/LeftMenu.tsx';
import LoadingOverlay from './components/LoadingOverlay.tsx';
import MapZone from './components/MapZone.tsx';
import NiceAlert from './components/Modals/NiceAlert.tsx';
import OverlayDrop from './components/OverlayDrop.tsx';
import TableWindow from './components/Modals/TableWindow.tsx';
import ClassificationPanel from './components/Modals/ClassificationPanel.tsx';
import { HeaderBarApp } from './components/Headers.tsx';
import ExampleDataModal from './components/Modals/ExampleDatasetModal.tsx';
// import ReloadPrompt from './components/ReloadPrompt.tsx';

// Stores
import { classificationPanelStore } from './store/ClassificationPanelStore';
import { fieldTypingModalStore } from './store/FieldTypingModalStore';
import { globalStore, setGlobalStore } from './store/GlobalStore';
import { mapStore, setMapStore } from './store/MapStore';
import {
  defaultLayersDescription,
  layersDescriptionStore,
  setLayersDescriptionStore,
} from './store/LayersDescriptionStore';
import { modalStore, setModalStore } from './store/ModalStore';
import { niceAlertStore, setNiceAlertStore } from './store/NiceAlertStore';
import { overlayDropStore, setOverlayDropStore } from './store/OverlayDropStore';
import { tableWindowStore } from './store/TableWindowStore';
import { applicationSettingsStore } from './store/ApplicationSettingsStore';
import { datasetCatalogStore } from './store/DatasetCatalogStore';

// Types and enums
import { ResizeBehavior } from './global.d';

// Other stuff
import { version } from '../package.json';

// Styles
import './styles/Transitions.css';

const loadGdal = async (): Promise<Gdal> => initGdalJs({
  paths: {
    wasm: wasmUrl,
    data: dataUrl,
    js: workerUrl,
  },
  useWorker: true,
});

let timeout: NodeJS.Timeout | null | undefined = null;

globalThis.Dexie = Dexie;
globalThis.db = new globalThis.Dexie('MagritProjectDb');
globalThis.db.version(1).stores({
  projects: '++id, date',
});

const onBeforeUnloadWindow = async (ev) => {
  // If there is no layer or if
  // there is only the sphere layer, do nothing
  if (
    layersDescriptionStore.layers.length < 1
    || (
      layersDescriptionStore.layers.length === 1
      && layersDescriptionStore.layers[0].renderer === 'sphere'
    )
  ) {
    return;
  }
  // Otherwise we store the state of the current projet
  // in the local DB (indexedDB via Dexie)
  const { layers } = layersDescriptionStore;
  const map = { ...mapStore };
  const obj = {
    layers,
    map,
  };
  globalThis.db.projects.add({
    date: new Date(),
    data: JSON.parse(JSON.stringify(obj)),
  });
  // The message is usually ignored in modern browsers
  ev.returnValue = 'Confirm exit ?'; // eslint-disable-line no-param-reassign
};

const dragEnterHandler = (e: Event): void => {
  e.preventDefault();
  e.stopPropagation();
  // Only files should trigger the opening of the drop overlay
  if (!draggedElementsAreFiles(e as DragEvent)) return;

  setOverlayDropStore({ show: true });
  // clearTimeout(timeout);
};

const dragOverHandler = (e: Event): void => {
  e.preventDefault();
  e.stopPropagation();
  // Only files should trigger the opening of the drop overlay
  if (!draggedElementsAreFiles(e as DragEvent)) return;

  setOverlayDropStore({ show: true });
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
  if (!draggedElementsAreFiles(e as DragEvent)) return;

  // We want the drop overlay to close if the cursor leaves the drop area
  // and there are no files in the drop area
  timeout = setTimeout(() => {
    if (overlayDropStore.files.length < 1) {
      setOverlayDropStore({ show: false, files: [] });
      timeout = null;
    }
  }, 1000);
};

const dropHandler = (e: Event): void => {
  e.preventDefault();
  e.stopPropagation();
  if (!draggedElementsAreFiles(e as DragEvent)) return;
  // Store name and type of the files dropped in a new array (CustomFileList) of FileEntry.
  const files = prepareFileExtensions((e as DragEvent).dataTransfer.files);
  setOverlayDropStore({ files });
  if (timeout) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      // setOverlayDropStore({ show: false, files: [] });
      timeout = null;
    }, 500);
  }
};

const reloadFromProjectObject = (obj: { layers: object, map: object }): void => {
  const { layers, map } = obj;
  setMapStore(map);
  const projection = d3[map.projection.value]()
    // .center(map.center)
    .scale(map.scale)
    .translate(map.translate);
  const pathGenerator = d3.geoPath(projection);
  setGlobalStore(
    'projection',
    () => projection,
  );
  setGlobalStore(
    'pathGenerator',
    () => pathGenerator,
  );
  setLayersDescriptionStore({ layers });
};

const AppPage: () => JSX.Element = () => {
  const { setLocale, LL } = useI18nContext();
  setLocale('en');

  // Set the maximum dimensions of the map for the current window size
  // (we need it before mounting the component because the map is
  // created when the component is mounted and the map uses mapStore.mapDimensions)
  const maxMapDimensions = {
    width: round((window.innerWidth - applicationSettingsStore.leftMenuWidth) * 0.9, 0),
    height: round((window.innerHeight - applicationSettingsStore.headerHeight) * 0.9, 0),
  };

  setMapStore({
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
    if (applicationSettingsStore.resizeBehavior === ResizeBehavior.ShrinkGrow) {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setGlobalStore({
        windowDimensions: {
          width,
          height,
        },
      });

      setMapStore({
        mapDimensions: {
          width: (width - applicationSettingsStore.leftMenuWidth) * 0.9,
          height: (height - applicationSettingsStore.headerHeight) * 0.9,
        },
      });
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
    // Add event listener to the window to handle resize events
    window.addEventListener('resize', onResize);
    // Add event listeners to the root element and the overlay drop
    // in order to handle drag and drop events (for files upload only)
    document.querySelectorAll('div#root, .overlay-drop')
      .forEach((el) => {
        el.addEventListener('dragenter', dragEnterHandler);
        el.addEventListener('dragover', dragOverHandler);
        el.addEventListener('dragleave', dragLeaveHandler);
        el.addEventListener('drop', dropHandler);
      });

    // Add event listener to the window to handle beforeunload events
    window.addEventListener('beforeunload', onBeforeUnloadWindow);

    // Event listeners for the buttons of the header bar
    document.getElementById('button-new-project')
      ?.addEventListener('click', () => {
        const createNewProject = (): void => {
          // Compute the default dimension of the map
          const mapWidth = round(
            (window.innerWidth - applicationSettingsStore.leftMenuWidth) * 0.9,
            0,
          );
          const mapHeight = round(
            (window.innerHeight - applicationSettingsStore.headerHeight) * 0.9,
            0,
          );

          // Remove all layers
          setLayersDescriptionStore(defaultLayersDescription());

          // Reset the map store
          setMapStore({
            mapDimensions: {
              width: mapWidth,
              height: mapHeight,
            },
            scale: 160,
            translate: [mapWidth / 2, mapHeight / 2],
            projection: {
              type: 'd3',
              value: 'geoNaturalEarth2',
              name: 'NaturalEarth2',
            },
          });

          // Reset projection and pathGenerator in the global store
          const projection = d3[mapStore.projection.value]()
            .translate(mapStore.translate)
            .scale(mapStore.scale);

          setGlobalStore({
            projection,
            pathGenerator: d3.geoPath(projection),
          });
        };

        setNiceAlertStore({
          show: true,
          content: () => <p>Create new empty project ?</p>,
          confirmCallback: () => {
            createNewProject();
          },
          focusOn: 'confirm',
        });
      });

    document.getElementById('button-export-project')
      ?.addEventListener('click', () => {
        const { layers } = layersDescriptionStore;
        const map = { ...mapStore };
        const obj = {
          layers,
          map,
        };
        const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(obj))}`;
        return clickLinkFromDataUrl(dataStr, 'export-project.mjson');
      });

    document.getElementById('button-import-project')
      ?.addEventListener('click', () => {
        const elem = document.createElement('input');
        elem.type = 'file';
        elem.accept = '.mjson';
        elem.onchange = (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result;
            if (!result) return;
            const obj = JSON.parse(result.toString());
            reloadFromProjectObject(obj);
          };
          reader.readAsText(file);
        };
        elem.click();
      });

    // Todo: the content of the about panel
    //  could be moved to a separate component
    document.getElementById('button-about-magrit')
      ?.addEventListener('click', () => {
        setModalStore({
          show: true,
          title: LL().AboutPanel.title(),
          escapeKey: 'confirm',
          content: <>
            <div>
              <p>
                <b>Version { version }</b>
              </p>
            </div>
            <br />
            <div>
              <p><b>{ LL().AboutPanel.description() }</b></p>
            </div>
            <hr />
            <div style={{ 'text-align': 'center' }}>
              <b>{ LL().AboutPanel.usefulLinks() }</b>
              <br />
              <p>
                <a
                  class={'button is-link'}
                  style={{ width: '280px' }}
                  href="https://riate.cnrs.fr"
                  target="_blank"
                >
                  <b>{ LL().AboutPanel.UarRiate() }</b>
                </a>
              </p>
              <p>
                <a
                  class={'button is-link'}
                  style={{ width: '280px' }}
                  href="https://magrit.cnrs.fr/docs/"
                  target="_blank"
                >
                  <b>{ LL().AboutPanel.documentation() }</b>
                </a>
              </p>
              <p>
                <a
                  class={'button is-link'}
                  style={{ width: '280px' }}
                  href="https://github.com/riatelab/magrit"
                  target="_blank"
                >
                  <b>{ LL().AboutPanel.linkGithub() }</b>
                </a>
              </p>
              <p>
                <a
                  class={'button is-link'}
                  style={{ width: '280px' }}
                  href="https://github.com/riatelab/magrit/issues"
                  target="_blank"
                >
                  <b>{ LL().AboutPanel.linkGithubIssues() }</b>
                </a>
              </p>
            </div>
          </>,
        });
      });

    // Load GDAL
    globalThis.Gdal = await loadGdal();

    // ... and store the number of drivers in the global store (we may change this)
    setGlobalStore({
      nDrivers: Object.keys(Gdal.drivers.raster).length + Object.keys(Gdal.drivers.vector).length,
    });

    // Is there a project in the DB ?
    const project = await globalThis.db.projects.toArray();
    // If there is a project, propose to reload it
    // and delete it from the DB
    if (project.length > 0) {
      const { date, data } = project[0];
      setNiceAlertStore({
        show: true,
        content: () => <p>{ LL().Alerts.ReloadLastProject(date.toLocaleDateString())}</p>,
        confirmCallback: () => { reloadFromProjectObject(data); },
        focusOn: 'confirm',
      });
    }
    // We only keep the last project in the DB
    // so at this point we can delete all projects
    globalThis.db.projects.clear();
  });

  return <>
    <HeaderBarApp />
    <main class="is-fullhd">
      <LeftMenu />
      <MapZone />
      <Show when={globalStore.isLoading }>
        <LoadingOverlay />
      </Show>
      <Transition name="slide-fade">
        <Show when={modalStore.show}>
          <DefaultModal />
        </Show>
        <Show when={niceAlertStore.show}>
          <NiceAlert />
        </Show>
        <Show when={tableWindowStore.show}>
          <TableWindow />
        </Show>
        <Show when={fieldTypingModalStore.show}>
          <FieldTypingModal />
        </Show>
        <Show when={classificationPanelStore.show}>
          <ClassificationPanel />
        </Show>
        <Show when={datasetCatalogStore.show}>
          <ExampleDataModal />
        </Show>
      </Transition>
    </main>
    <Toaster />
    <OverlayDrop />
    {/* <ReloadPrompt /> */}
  </>;
};

export default AppPage;
