import initGdalJs from 'gdal3.js';
import workerUrl from 'gdal3.js/dist/package/gdal3.js?url'; // eslint-disable-line import/extensions
import dataUrl from 'gdal3.js/dist/package/gdal3WebAssembly.data?url';
import wasmUrl from 'gdal3.js/dist/package/gdal3WebAssembly.wasm?url';
import { JSX, onMount, Show } from 'solid-js';
import { Toaster } from 'solid-toast';

import { useI18nContext } from './i18n/i18n-solid';

import { draggedElementsAreFiles, prepareFileExtensions } from './helpers/fileUpload';

import { HeaderBarApp } from './components/Headers.tsx';
import LeftMenu from './components/LeftMenu.tsx';
import LoadingOverlay from './components/LoadingOverlay.tsx';
import MapZone from './components/MapZone.tsx';
import DefaultModal from './components/ModalWindow.tsx';
import OverlayDrop from './components/OverlayDrop.tsx';
import NiceAlert from './components/NiceAlert.tsx';

import { globalStore, setGlobalStore } from './store/GlobalStore';
import { modalStore, setModalStore } from './store/ModalStore';
import { niceAlertStore } from './store/NiceAlertStore';
import { overlayDropStore, setOverlayDropStore } from './store/OverlayDropStore';

const loadGdal = async (): Promise<Gdal> => initGdalJs({
  paths: {
    wasm: wasmUrl,
    data: dataUrl,
    js: workerUrl,
  },
  useWorker: true,
});

const SomeElement = (): JSX.Element => {
  const onClick = () => console.log('Logged from SomeElement');

  return <>
    <h2>My super content</h2>
    <div onClick={onClick}>Lorem ipsum</div
  ></>;
};

let timeout: NodeJS.Timeout | null | undefined = null;

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

const AppPage: () => JSX.Element = () => {
  const { setLocale } = useI18nContext();
  setLocale('en');

  onMount(async () => {
    // Add event listeners to the root element and the overlay drop
    // in order to handle drag and drop events (for files upload only)
    document.querySelectorAll('div#root, .overlay-drop')
      .forEach((el) => {
        el.addEventListener('dragenter', dragEnterHandler);
        el.addEventListener('dragover', dragOverHandler);
        el.addEventListener('dragleave', dragLeaveHandler);
        el.addEventListener('drop', dropHandler);
      });

    // Load GDAL
    window.Gdal = await loadGdal();

    const maxMapDimensions = {
      width: window.innerWidth - 310,
      height: window.innerHeight - 66,
    };

    setGlobalStore({
      nDrivers: Object.keys(Gdal.drivers.raster).length + Object.keys(Gdal.drivers.vector).length,
      mapDimensions: maxMapDimensions,
    });
  });

  return <>
    <HeaderBarApp />
    <main class="is-fullhd">
      <LeftMenu />
      <MapZone />
{/*      <div style="width: calc(100vw - 300px); position: fixed; left: 300px;">
        <For each={ layersDescriptionStore.layers }>
          {
            (d) => {
              const {
                id, name, type, target,
              } = d;
              return <div>
                <span classList={{ 'is-active': !!target }}>{`${id} ${name} ${type}`}</span>
              </div>;
            }
          }
        </For>
      </div> */}
      <Show when={globalStore.isLoading }>
        <LoadingOverlay />
      </Show>
      <Show when={modalStore.show}>
        <DefaultModal />
      </Show>
      <Show when={niceAlertStore.show}>
        <NiceAlert />
      </Show>
    </main>
    <button style="position: absolute; right: 0; top; 200;" onClick={
      () => {
        setModalStore({
          show: true,
          title: 'My super title',
          content: SomeElement(),
          confirmCallback: (): void => { console.log('confirm'); },
          cancelCallback: (): void => { console.log('cancel'); },
        });
      }
    }>Click me</button>
    <Toaster />
    <OverlayDrop />
  </>;
};

export default AppPage;
