import { createStore } from 'solid-js/store';

type GlobalStoreType = {
  nDrivers: number | null,
  isLoading: boolean,
  workerToCancel: Array<Worker>,
  mapDimensions: { width: number, height: number },
};

const [
  globalStore,
  setGlobalStore,
] = createStore({
  nDrivers: null,
  isLoading: false,
  workerToCancel: [],
  mapDimensions: { width: 0, height: 0 },
} as GlobalStoreType);

export {
  globalStore,
  setGlobalStore,
};
