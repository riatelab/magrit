import { createStore } from 'solid-js/store';
// import { v4 as uuidv4 } from 'uuid';

type LayersDescriptionStoreType = {
  layers: Array<LayerDescription>,
};

const [
  layersDescriptionStore,
  setLayersDescriptionStore,
] = createStore({
  layers: [
    // { id: uuidv4(), name: 'John', type: 'raster' },
    // { id: uuidv4(), name: 'Jane', type: 'point' },
    // {
    //   id: uuidv4(), name: 'Jimmy', target: true, type: 'polygon',
    // },
    // { id: uuidv4(), name: 'Jill', type: 'linestring' },
    // { id: uuidv4(), name: 'Jack', type: 'table' },
  ],
} as LayersDescriptionStoreType);

export {
  layersDescriptionStore,
  setLayersDescriptionStore,
};
