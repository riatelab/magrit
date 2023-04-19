import initGdalJs from 'gdal3.js';
import workerUrl from 'gdal3.js/dist/package/gdal3.js?url'; // eslint-disable-line import/extensions
import dataUrl from 'gdal3.js/dist/package/gdal3WebAssembly.data?url';
import wasmUrl from 'gdal3.js/dist/package/gdal3WebAssembly.wasm?url';
import { For, JSX, onMount } from 'solid-js';
import { HeaderBarApp } from './header.tsx';
import { useI18nContext } from './i18n/i18n-solid';
import { globalStore, setGlobalStore } from './GlobalStore';
import { layersDescriptionStore } from './LayersDescriptionStore';
import LeftMenu from './LeftMenu.tsx';

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
    </main>
  </>;
};

export default AppPage;
