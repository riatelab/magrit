import { createSignal } from 'solid-js';

const [
  gdalLoaded,
  setGdalLoaded,
] = createSignal<boolean>(false);

export { gdalLoaded, setGdalLoaded };
