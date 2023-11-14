import { v4 as uuidv4 } from 'uuid';

// Helpers
import d3 from './d3-custom';
import worldLand from './world-land';
import topojson from './topojson';

// Types
import {
  type LayerDescription,
  type MultiLineString,
  RepresentationType,
} from '../global';

export const generateIdLayer = () => `Layer-${uuidv4()}`;

/**
 * Whether the map already has a sphere layer.
 *
 * @param {LayerDescription[]} layersDescription
 * @returns {boolean}
 */
export const alreadyHasSphere = (
  layersDescription: LayerDescription[],
): boolean => layersDescription.some((layer: LayerDescription) => layer.renderer === 'sphere');

/**
 * Whether the map already has a graticule layer.
 *
 * @param {LayerDescription[]} layersDescription
 * @returns {boolean}
 */
export const alreadyHasGraticule = (
  layersDescription: LayerDescription[],
): boolean => layersDescription.some((layer: LayerDescription) => layer.renderer === 'graticule');

export const makeDefaultWorldLand = (): LayerDescription => ({
  type: 'polygon',
  id: generateIdLayer(),
  name: 'World land',
  visible: true,
  strokeColor: '#d1d1d1',
  strokeWidth: '1',
  strokeOpacity: 1,
  fillColor: '#d1d1d1',
  fillOpacity: 1,
  dropShadow: false,
  shapeRendering: 'auto',
  fields: [],
  renderer: 'default' as RepresentationType,
  data: topojson.feature(worldLand, worldLand.objects.world_country),
});

export const makeDefaultSphere = (): LayerDescription => ({
  type: 'polygon',
  id: generateIdLayer(),
  name: 'Sphere',
  visible: true,
  strokeColor: '#808080',
  strokeWidth: '1',
  strokeOpacity: 1,
  fillColor: '#e8e8f6',
  fillOpacity: 1,
  dropShadow: false,
  shapeRendering: 'auto',
  fields: [],
  renderer: 'sphere' as RepresentationType,
  data: { type: 'Sphere' },
});

export const makeDefaultGraticule = (): LayerDescription => ({
  type: 'linestring',
  id: generateIdLayer(),
  name: 'Graticule',
  visible: true,
  strokeColor: '#808080',
  strokeWidth: '1',
  strokeOpacity: 0.3,
  strokeDasharray: '5 5',
  dropShadow: false,
  shapeRendering: 'auto',
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
