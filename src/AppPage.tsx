import initGdalJs from 'gdal3.js';
import workerUrl from 'gdal3.js/dist/package/gdal3.js?url'; // eslint-disable-line import/extensions
import dataUrl from 'gdal3.js/dist/package/gdal3WebAssembly.data?url';
import wasmUrl from 'gdal3.js/dist/package/gdal3WebAssembly.wasm?url';
import {
  For, JSX, onMount, Show,
} from 'solid-js';
import { HeaderBarApp } from './header.tsx';
import { useI18nContext } from './i18n/i18n-solid';
import { globalStore, setGlobalStore } from './store/GlobalStore';
import { layersDescriptionStore } from './store/LayersDescriptionStore';
import LeftMenu from './LeftMenu.tsx';
import DefaultModal from './ModalWindow.tsx';
import OverlayDrop from './OverlayDrop.tsx';
import { modalStore, setModalStore } from './store/ModalStore';
import { overlayDropStore, setOverlayDropStore } from './store/OverlayDropStore';
import { prepareFileExtensions } from './helpers/fileUpload';

const loadGdal = async (): Promise<Gdal> => initGdalJs({
  paths: {
    wasm: wasmUrl,
    data: dataUrl,
    js: workerUrl,
  },
  useWorker: true,
});

let Gdal: any = null;

const SomeElement = (): JSX.Element => {
  const onClick = () => console.log('Logged from SomeElement');

  return <>
    <h2>My super content</h2>
    <div onClick={onClick}>Lorem ipsum</div
  ></>;
};

let timeout: NodeJS.Timeout | null | undefined = null;

const dragEnterHandler = (e: DragEvent): void => {
  e.preventDefault();
  e.stopPropagation();
  if (!e.dataTransfer?.types.some((el) => el === 'Files')) {
    return;
  }
  setOverlayDropStore({ show: true });
  // clearTimeout(timeout);
};

const dragOverHandler = (e: DragEvent): void => {
  e.preventDefault();
  e.stopPropagation();
  setOverlayDropStore({ show: true });
  if (timeout) {
    clearTimeout(timeout);
    // timeout = setTimeout(() => {
    //   setOverlayDropStore({ show: false });
    //   timeout = null;
    // }, 2500);
  }
};

const dragLeaveHandler = (e: DragEvent): void => {
  e.preventDefault();
  e.stopPropagation();
  timeout = setTimeout(() => {
    if (overlayDropStore.files.length < 1) {
      setOverlayDropStore({ show: false, files: [] });
      timeout = null;
    }
  }, 1000);
};

const dropHandler = (e: DragEvent): void => {
  e.preventDefault();
  e.stopPropagation();
  const files = prepareFileExtensions(e.dataTransfer.files);
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
    document.querySelector('div#root').addEventListener(
      'dragenter',
      dragEnterHandler,
    );

    document.querySelector('div#root').addEventListener(
      'dragover',
      dragOverHandler,
    );

    document.querySelector('div#root').addEventListener(
      'dragleave',
      dragLeaveHandler,
    );

    document.querySelector('div#root').addEventListener(
      'drop',
      dropHandler,
    );

    document.querySelector('.overlay-drop').addEventListener(
      'dragenter',
      dragEnterHandler,
    );

    document.querySelector('.overlay-drop').addEventListener(
      'dragover',
      dragOverHandler,
    );

    document.querySelector('.overlay-drop').addEventListener(
      'dragleave',
      dragLeaveHandler,
    );

    document.querySelector('.overlay-drop').addEventListener(
      'drop',
      dropHandler,
    );

    Gdal = await loadGdal();
    setGlobalStore({
      nDrivers: Object.keys(Gdal.drivers.raster).length + Object.keys(Gdal.drivers.vector).length,
    });
  });

  return <>
    <HeaderBarApp />
    <main class="is-fullhd">
      <hr></hr>
      <LeftMenu />
      <div style="width: calc(100vw - 300px); position: fixed; left: 300px;">
        <div>{ globalStore.nDrivers } GDAL drivers</div>
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
      </div>
      <Show when={modalStore.show}>
        <DefaultModal />
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
    <OverlayDrop />
  </>;
};

export default AppPage;
