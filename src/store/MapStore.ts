import { createStore } from 'solid-js/store';
import { ProjectionDefinition } from '../global';

type MapStoreType = {
  projection: ProjectionDefinition,
  translate: number[],
  scale: number,
  center: number[],
  rotate: number[],
  mapDimensions: { width: number, height: number },
  lockZoomPan: boolean,
};

const [
  mapStore,
  setMapStore,
] = createStore({
  projection: {
    type: 'd3',
    value: 'geoNaturalEarth2',
    name: 'NaturalEarth2',
  },
  translate: [0, 0],
  scale: 1,
  center: [0, 0],
  rotate: [0, 0, 0],
  mapDimensions: { width: 0, height: 0 },
  lockZoomPan: false,
} as MapStoreType);

export {
  mapStore,
  setMapStore,
};
