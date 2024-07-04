import { createStore } from 'solid-js/store';
import { Accessor, JSX } from 'solid-js';
import { TranslationFunctions } from '../i18n/i18n-types';

type NiceAlertStoreType = {
  show: boolean,
  content: (() => JSX.Element) | JSX.Element | string | null,
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

const showErrorMessage = (message: string, LL: Accessor<TranslationFunctions>) => {
  setNiceAlertStore({
    type: 'error',
    content: `${LL().PortrayalSelection.Error(message)}`,
    show: true,
  });
};

export {
  niceAlertStore,
  setNiceAlertStore,
  resetNiceAlertStore,
  showErrorMessage,
};
