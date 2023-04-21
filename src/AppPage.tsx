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
import { modalStore, setModalStore } from './store/ModalStore';

const loadGdal = async (): Promise<Gdal> => initGdalJs({
  paths: {
    wasm: wasmUrl,
    data: dataUrl,
    js: workerUrl,
  },
  useWorker: true,
});

let Gdal: any = null;

const AppPage: () => JSX.Element = () => {
  const { setLocale } = useI18nContext();
  setLocale('en');

  onMount(async () => {
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
        <div>{ globalStore.nDrivers || ('foo' && console.log(globalStore)) }</div>
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
          content: <><h2>My super content</h2><div>Lorem ipsum</div></>,
          confirmCallback: (): void => { console.log('confirm'); },
          cancelCallback: (): void => { console.log('cancel'); },
        });
      }
    }>Click me</button>
  </>;
};

export default AppPage;
