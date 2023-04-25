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
};

const [
  modalStore,
  setModalStore,
] = createStore({
  show: false,
  title: null,
  content: null,
  confirmCallback: null,
  cancelCallback: null,
  successButton: null,
  cancelButton: null,
} as ModalStoreType);

export {
  modalStore,
  setModalStore,
};
