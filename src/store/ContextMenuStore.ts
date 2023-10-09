import { createStore } from 'solid-js/store';

type ContextMenuEntry = {
  type?: 'entry' | 'divider',
  label?: string,
  callback?: () => void,
};

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
