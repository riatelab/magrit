import { createStore } from 'solid-js/store';

import type { CustomFileList } from '../helpers/fileUpload';

export type FileDropStoreType = {
  show: boolean,
  files: CustomFileList,
};

const [
  fileDropStore,
  setFileDropStore,
] = createStore({
  show: false,
  files: [],
} as FileDropStoreType);

export {
  fileDropStore,
  setFileDropStore,
};
