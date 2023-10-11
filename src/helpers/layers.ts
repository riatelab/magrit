import { v4 as uuidv4 } from 'uuid';
import d3 from './d3-custom';
import {
  type LayerDescription,
  type MultiLineString,
  RepresentationType,
} from '../global';

export const alreadyHasSphere = (
  layersDescription: LayerDescription[],
): boolean => layersDescription.some((layer: LayerDescription) => layer.renderer === 'sphere');
export const alreadyHasGraticule = (
  layersDescription: LayerDescription[],
): boolean => layersDescription.some((layer: LayerDescription) => layer.renderer === 'graticule');

export const makeDefaultSphere = (): LayerDescription => ({
  type: 'polygon',
  id: uuidv4(),
  name: 'Sphere',
  visible: true,
  strokeColor: '#808080',
  strokeWidth: '1',
  strokeOpacity: 1,
  fillColor: '#e8e8f6',
  fillOpacity: 1,
  dropShadow: false,
  fields: [],
  renderer: 'sphere' as RepresentationType,
  data: { type: 'Sphere' },
});

export const makeDefaultGraticule = (): LayerDescription => ({
  type: 'linestring',
  id: uuidv4(),
  name: 'Graticule',
  visible: true,
  strokeColor: '#808080',
  strokeWidth: '1',
  strokeOpacity: 1,
  strokeDasharray: '5 5',
  dropShadow: false,
  renderer: 'graticule' as RepresentationType,
  data: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { id: '0' },
        geometry: d3.geoGraticule().step([20, 20])() as MultiLineString,
      },
    ],
  },
  fields: [],
});
