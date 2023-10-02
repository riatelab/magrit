import { createStore } from 'solid-js/store';
import { JSX } from 'solid-js';

type NiceAlertStoreType = {
  show: boolean,
  content: JSX.Element | (() => JSX.Element) | string | null,
  type: 'success' | 'error' | 'warning' | null,
  confirmCallback: (() => void) | null,
  cancelCallback: (() => void) | null,
  successButton: string | null,
  cancelButton: string | null,
  focusOn: 'confirm' | 'cancel' | null,
};

const [
  niceAlertStore,
  setNiceAlertStore,
] = createStore({
  show: false,
  content: null,
  type: null,
  confirmCallback: null,
  cancelCallback: null,
  successButton: null,
  cancelButton: null,
  focusOn: null,
} as NiceAlertStoreType);

const resetNiceAlertStore = () => {
  setNiceAlertStore({
    show: false,
    content: null,
    type: null,
    confirmCallback: null,
    cancelCallback: null,
    successButton: null,
    cancelButton: null,
    focusOn: null,
  });
};

export {
  niceAlertStore,
  setNiceAlertStore,
  resetNiceAlertStore,
};
