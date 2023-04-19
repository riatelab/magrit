import { createStore, Store, SetStoreFunction } from 'solid-js/store';

interface GlobalStoreType {
  nDrivers: number,
  gdalObj: any,
}

type GlobalStoreFunctions = [
  get: Store<GlobalStoreType>,
  set: SetStoreFunction<GlobalStoreType>,
];
const [
  globalStore,
  setGlobalStore,
]: GlobalStoreFunctions = createStore({
  nDrivers: null,
  gdalObj: null,
});

export {
  globalStore,
  setGlobalStore,
};
