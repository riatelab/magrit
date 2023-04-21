import { createStore } from 'solid-js/store';

// interface ModalStoreType {
//   title: string,
//   content: string,
//   show: boolean,
//   confirmCallback?: () => void,
//   cancelCallback?: () => void,
//   successButton?: string,
//   cancelButton?: string,
// };

const [
  modalStore,
  setModalStore,
] = createStore({
  title: '',
  content: '',
  show: false,
  confirmCallback: null,
  cancelCallback: null,
  successButton: null,
  cancelButton: null,
});

export {
  modalStore,
  setModalStore,
};
