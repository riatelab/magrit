import { createStore } from 'solid-js/store';

type OverlayDropStoreType = {
  show: boolean,
  files: CustomFileList,
};

const [
  overlayDropStore,
  setOverlayDropStore,
] = createStore({
  show: false,
  files: [],
} as OverlayDropStoreType);

export {
  overlayDropStore,
  setOverlayDropStore,
};
