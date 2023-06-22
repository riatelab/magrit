import { createStore } from 'solid-js/store';

type TableWindowStoreType = {
  show: boolean,
  editable: boolean,
  layerId: string,
};

const [
  tableWindowStore,
  setTableWindowStore,
] = createStore({
  show: false,
  editable: false,
  layerId: '',
} as TableWindowStoreType);

export {
  tableWindowStore,
  setTableWindowStore,
};
