import { createStore } from 'solid-js/store';

type GlobalStoreType = {
  isLoading: boolean,
  workerToCancel: Array<Worker>,
  windowDimensions: { width: number, height: number },
  projection: any,
  pathGenerator: any,
  userHasAddedLayer: boolean,
};

const [
  globalStore,
  setGlobalStore,
] = createStore({
  isLoading: false,
  workerToCancel: [],
  windowDimensions: { width: 0, height: 0 },
  projection: null,
  pathGenerator: null,
  userHasAddedLayer: false,
} as GlobalStoreType);

export {
  globalStore,
  setGlobalStore,
};
