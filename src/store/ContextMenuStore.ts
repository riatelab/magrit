import { createStore } from 'solid-js/store';

type ItemEntry = {
  type?: 'entry' | 'item',
  label: string,
  callback: () => void,
};

type DividerEntry = {
  type: 'divider',
};

export type ContextMenuEntry = ItemEntry | DividerEntry;

type ContextMenuStoreType = {
  show: boolean,
  position: [number, number],
  entries: ContextMenuEntry[],
};

const emptyStore = () => ({
  show: false,
  position: [NaN, NaN],
  entries: [],
}) as ContextMenuStoreType;

const [
  contextMenuStore,
  setContextMenuStore,
] = createStore(emptyStore());

const resetContextMenuStore = () => {
  setContextMenuStore(emptyStore());
};

export {
  contextMenuStore,
  setContextMenuStore,
  resetContextMenuStore,
};
