import { createStore } from 'solid-js/store';
import { JSX } from 'solid-js';
import { LocalizedString } from 'typesafe-i18n';

type ModalStoreType = {
  show: boolean,
  title: LocalizedString | null,
  content: JSX.Element | (() => JSX.Element) | null,
  confirmCallback: (() => void) | null,
  cancelCallback: (() => void) | null,
  successButton: LocalizedString | null,
  cancelButton: LocalizedString | null,
  escapeKey: 'confirm' | 'cancel' | null,
  width?: string,
};

const getEmptyModalStore = () => ({
  show: false,
  title: null,
  content: null,
  confirmCallback: null,
  cancelCallback: null,
  successButton: null,
  cancelButton: null,
  escapeKey: null,
  width: undefined,
} as ModalStoreType);

const [
  modalStore,
  setModalStore,
] = createStore(getEmptyModalStore());

const resetModalStore = () => setModalStore(getEmptyModalStore());

export {
  modalStore,
  setModalStore,
  resetModalStore,
};
