import { createStore } from 'solid-js/store';

// TODO: this is temporary, we will probably remove this store in a near future to avoid
//   multiple stores (for almost the same purpose) and to simplify the code.

type PortrayalSelectionStoreType = {
  show: boolean,
  layerId: string,
};

const emptyStore = () => ({
  show: false,
  layerId: '',
}) as PortrayalSelectionStoreType;

const [
  portrayalSelectionStore,
  setPortrayalSelectionStore,
] = createStore(emptyStore());

export {
  portrayalSelectionStore,
  setPortrayalSelectionStore,
  emptyStore,
};
