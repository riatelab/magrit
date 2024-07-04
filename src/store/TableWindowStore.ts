import { createStore } from 'solid-js/store';

type TableWindowStoreType = {
  show: boolean,
  editable: boolean,
  identifier?: {
    type: 'layer' | 'table',
    id: string,
  },
};

const defaultTableWindowStore = () => ({
  show: false,
  editable: false,
  identifier: undefined,
} as TableWindowStoreType);

const [
  tableWindowStore,
  setTableWindowStore,
] = createStore(defaultTableWindowStore());

const resetTableWindowStore = () => { setTableWindowStore(defaultTableWindowStore()); };

export {
  tableWindowStore,
  setTableWindowStore,
  resetTableWindowStore,
};
