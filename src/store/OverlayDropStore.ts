import { createStore } from 'solid-js/store';

const [
  overlayDropStore,
  setOverlayDropStore,
] = createStore({
  show: false,
  files: [],
});

export {
  overlayDropStore,
  setOverlayDropStore,
};
