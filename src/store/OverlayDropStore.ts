import { createStore } from 'solid-js/store';

import type { CustomFileList } from '../helpers/fileUpload';

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
