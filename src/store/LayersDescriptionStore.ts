import { createStore } from 'solid-js/store';
import { makeDefaultGraticule, makeDefaultSphere } from '../helpers/layers';
import {
  type LayerDescription,
  type MultiLineString,
  RepresentationType,
} from '../global';

type LayersDescriptionStoreType = {
  layers: Array<LayerDescription>,
};

const defaultLayersDescription = (): LayersDescriptionStoreType => ({
  layers: [
    makeDefaultGraticule(),
    makeDefaultSphere(),
  ],
});

const [
  layersDescriptionStore,
  setLayersDescriptionStore,
] = createStore(defaultLayersDescription());

console.log(layersDescriptionStore.layers[1].data);

export {
  layersDescriptionStore,
  setLayersDescriptionStore,
  defaultLayersDescription,
};
