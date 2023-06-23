import { createStore } from 'solid-js/store';

type FieldTypingModalStoreType = {
  show: boolean,
  layerId: string,
};

const [
  fieldTypingModalStore,
  setFieldTypingModalStore,
] = createStore({
  show: false,
  layerId: '',
} as FieldTypingModalStoreType);

export {
  fieldTypingModalStore,
  setFieldTypingModalStore,
};
