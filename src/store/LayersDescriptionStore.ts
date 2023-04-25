import { createStore } from 'solid-js/store';

type LayersDescriptionStoreType = {
  layers: Array<{ id: number, name: string, type: string }>,
};

const [
  layersDescriptionStore,
  setLayersDescriptionStore,
] = createStore({
  layers: [
    { id: 1, name: 'John', type: 'raster' },
    { id: 2, name: 'Jane', type: 'point' },
    {
      id: 3, name: 'Jimmy', target: true, type: 'polygon',
    },
    { id: 4, name: 'Jill', type: 'line' },
    { id: 5, name: 'Jack', type: 'table' },
  ],
} as LayersDescriptionStoreType);

export {
  layersDescriptionStore,
  setLayersDescriptionStore,
};
