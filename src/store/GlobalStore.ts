import { createStore } from 'solid-js/store';

type GlobalStoreType = {
  isLoading: boolean,
  workerToCancel: Array<Worker>,
  windowDimensions: { width: number, height: number },
  projection: any,
  pathGenerator: any,
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
} as GlobalStoreType);

export {
  globalStore,
  setGlobalStore,
};
