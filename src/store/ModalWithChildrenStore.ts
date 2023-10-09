import { createStore } from 'solid-js/store';
import { JSX } from 'solid-js';

type ModalStoreType = {
  show: boolean,
  title: string | null,
  content: JSX.Element | string | null,
  confirmCallback: (() => void) | null,
  cancelCallback: (() => void) | null,
  successButton: string | null,
  cancelButton: string | null,
  escapeKey: 'confirm' | 'cancel' | null,
};

const emptyStore = () => ({
  show: false,
  title: null,
  content: null,
  confirmCallback: null,
  cancelCallback: null,
  successButton: null,
  cancelButton: null,
  escapeKey: null,
} as ModalStoreType);

const [
  modalWithChildrenStore,
  setModalWithChildrenStore,
] = createStore(emptyStore());

const resetModalWithChildrenStore = () => {
  setModalWithChildrenStore(emptyStore());
};

export {
  resetModalWithChildrenStore,
  modalWithChildrenStore,
  setModalWithChildrenStore,
};
