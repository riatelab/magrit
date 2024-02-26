import { createStore } from 'solid-js/store';
import { JSX } from 'solid-js';
import { LocalizedString } from 'typesafe-i18n';

type ModalStoreType = {
  show: boolean,
  title: LocalizedString | string | null,
  content: JSX.Element | (() => JSX.Element) | string | null,
  confirmCallback: (() => void) | null,
  cancelCallback: (() => void) | null,
  successButton: LocalizedString | string | null,
  cancelButton: LocalizedString | string | null,
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
