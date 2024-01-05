import { createStore } from 'solid-js/store';

type FieldTypingModalStoreType = {
  show: boolean,
  targetId: string | null,
  targetType: 'layer' | 'table' | null,
};

const [
  fieldTypingModalStore,
  setFieldTypingModalStore,
] = createStore({
  show: false,
  targetId: null,
  targetType: null,
} as FieldTypingModalStoreType);

const resetFieldTypingModalStore = () => {
  setFieldTypingModalStore({
    show: false,
    targetId: null,
    targetType: null,
  });
};

export {
  fieldTypingModalStore,
  setFieldTypingModalStore,
  resetFieldTypingModalStore,
};
