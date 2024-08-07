import { createStore } from 'solid-js/store';
import { yieldOrContinue } from 'main-thread-scheduling';

import { version } from '../../package.json';

type GlobalStoreType = {
  version: string,
  isLoading: boolean,
  isReloadingProject: boolean,
  isInfo: boolean,
  infoTargetFeature: { layer: string, properties: Record<string, any> } | null,
  loadingMessage: string,
  workerToCancel: Array<Worker>,
  windowDimensions: { width: number, height: number },
  projection: any,
  pathGenerator: any,
  userHasAddedLayer: boolean,
  snapToGridWhenDragging: boolean,
  displaySnappingGrid: boolean,
  // Size of the header (note that this is computed from the CSS)
  headerHeight: number,
  // Size of the left menu (note that this is computed from the CSS)
  leftMenuWidth: number,
};

const [
  globalStore,
  setGlobalStore,
] = createStore({
  version,
  isLoading: false,
  isReloadingProject: false,
  isInfo: false,
  infoTargetFeature: null,
  loadingMessage: '',
  workerToCancel: [],
  windowDimensions: { width: 0, height: 0 },
  projection: null,
  pathGenerator: null,
  userHasAddedLayer: false,
  snapToGridWhenDragging: false,
  displaySnappingGrid: false,
  headerHeight: +(getComputedStyle(document.documentElement).getPropertyValue('--header-height').replace('px', '')),
  leftMenuWidth: +(getComputedStyle(document.documentElement).getPropertyValue('--left-menu-width').replace('px', '')),
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
