import { createStore } from 'solid-js/store';
import { v4 as uuidv4 } from 'uuid';
import { LayerDescription, RepresentationType } from '../global';

type LayersDescriptionStoreType = {
  layers: Array<LayerDescription>,
};

const defaultLayersDescription = (): LayersDescriptionStoreType => ({
  layers: [
    {
      type: 'polygon',
      id: uuidv4(),
      name: 'Sphere',
      visible: true,
      strokeColor: '#000000',
      strokeWidth: '1',
      strokeOpacity: 1,
      fillColor: '#f2f2f7',
      fillOpacity: 1,
      renderer: 'sphere' as RepresentationType,
      data: { type: 'Sphere' },
    },
  ],
});

const [
  layersDescriptionStore,
  setLayersDescriptionStore,
] = createStore(defaultLayersDescription());

export {
  layersDescriptionStore,
  setLayersDescriptionStore,
  defaultLayersDescription,
};
