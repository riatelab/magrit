import { createStore } from 'solid-js/store';
import { LayerDescription } from '../global';

type LayersDescriptionStoreType = {
  layers: Array<LayerDescription>,
};

const [
  layersDescriptionStore,
  setLayersDescriptionStore,
] = createStore({
  layers: [],
} as LayersDescriptionStoreType);

export {
  layersDescriptionStore,
  setLayersDescriptionStore,
};
