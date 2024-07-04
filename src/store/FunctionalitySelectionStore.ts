import { createStore } from 'solid-js/store';

type FunctionalitySelectionStoreType = {
  show: boolean,
  id: string,
  type: 'layer' | 'table' | '',
};

const emptyStore = () => ({
  show: false,
  id: '',
  type: '',
}) as FunctionalitySelectionStoreType;

const [
  functionalitySelectionStore,
  setFunctionalitySelectionStore,
] = createStore(emptyStore());

export {
  functionalitySelectionStore,
  setFunctionalitySelectionStore,
  emptyStore,
};
