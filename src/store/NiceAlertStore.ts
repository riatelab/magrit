import { createStore } from 'solid-js/store';

type NiceAlertStoreType = {
  show: boolean,
  content: string | null,
  confirmCallback: (() => void) | null,
  cancelCallback: (() => void) | null,
  successButton: string | null,
  cancelButton: string | null,
};

const [
  niceAlertStore,
  setNiceAlertStore,
] = createStore({
  show: false,
  content: null,
  confirmCallback: null,
  cancelCallback: null,
  successButton: null,
  cancelButton: null,
} as NiceAlertStoreType);

export {
  niceAlertStore,
  setNiceAlertStore,
};
