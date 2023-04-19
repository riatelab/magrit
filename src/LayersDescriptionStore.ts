import { createStore } from 'solid-js/store';

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
});

export {
  layersDescriptionStore,
  setLayersDescriptionStore,
};
