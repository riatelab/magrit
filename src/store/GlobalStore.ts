import { createStore } from 'solid-js/store';

type GlobalStoreType = {
  nDrivers: number | null,
  isLoading: boolean,
  workerToCancel: Array<Worker>,
  // mapDimensions: { width: number, height: number },
  windowDimensions: { width: number, height: number },
  projection: any,
  pathGenerator: any,
};

const [
  globalStore,
  setGlobalStore,
] = createStore({
  nDrivers: null,
  isLoading: false,
  workerToCancel: [],
  // mapDimensions: { width: 0, height: 0 },
  windowDimensions: { width: 0, height: 0 },
  projection: null,
  pathGenerator: null,
} as GlobalStoreType);

export {
  globalStore,
  setGlobalStore,
};
