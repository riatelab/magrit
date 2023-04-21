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
import { setOverlayDropStore } from './store/OverlayDropStore';

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

let timeout = null;

const dragEnterHandler = (/* e: DragEvent */): void => {
  // console.log('dragEnterHandler', e);
  setOverlayDropStore({ show: true });
  clearTimeout(timeout);
};

const dragOverHandler = (/* e: DragEvent */): void => {
  // console.log('dragOverHandler', e);
  setOverlayDropStore({ show: true });
  clearTimeout(timeout);
};

const dragLeaveHandler = (/* e: DragEvent */): void => {
  // console.log('dragLeaveHandler', e);
  timeout = setTimeout(() => {
    setOverlayDropStore({ show: false });
  }, 150);
};

const dropHandler = (e: DragEvent): void => {
  clearTimeout(timeout);
  console.log('dropHandler', e);
  e.preventDefault();
};

const AppPage: () => JSX.Element = () => {
  const { setLocale } = useI18nContext();
  setLocale('en');

  onMount(async () => {
    document.querySelector('body').addEventListener(
      'dragenter',
      dragEnterHandler,
    );

    document.querySelector('body').addEventListener(
      'dragover',
      dragOverHandler,
    );

    document.querySelector('body').addEventListener(
      'dragleave',
      dragLeaveHandler,
    );

    document.querySelector('body').addEventListener(
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
