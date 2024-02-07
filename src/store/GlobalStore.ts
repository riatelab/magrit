import { createStore } from 'solid-js/store';
import { yieldOrContinue } from 'main-thread-scheduling';

import { version } from '../../package.json';

type GlobalStoreType = {
  version: string,
  isLoading: boolean,
  isReloadingProject: boolean,
  loadingMessage: string,
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
  version,
  isLoading: false,
  isReloadingProject: false,
  loadingMessage: '',
  workerToCancel: [],
  windowDimensions: { width: 0, height: 0 },
  projection: null,
  pathGenerator: null,
  userHasAddedLayer: false,
} as GlobalStoreType);

const setLoading = (isLoading: boolean, message?: string) => {
  // If isLoading is false, we reset the message,
  // otherwise we set it to the message passed in if any or an empty string.
  const msg = !isLoading // eslint-disable-line no-nested-ternary
    ? ''
    : message === undefined
      ? ''
      : message;

  // Update store
  setGlobalStore({
    isLoading,
    loadingMessage: msg,
  });
};

const setLoadingMessage = async (message: string) => {
  await yieldOrContinue('idle');
  setGlobalStore('loadingMessage', message);
  await yieldOrContinue('interactive');
};

const setReloadingProject = (isReloadingProject: boolean) => {
  const loadingMessage = isReloadingProject ? 'Reloading' : '';
  setGlobalStore({
    isLoading: isReloadingProject,
    isReloadingProject,
    loadingMessage,
  });
};

export {
  globalStore,
  setGlobalStore,
  setLoading,
  setLoadingMessage,
  setReloadingProject,
};
