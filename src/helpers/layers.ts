// Imports from other libraries
import { v4 as uuidv4 } from 'uuid';
import { getPalette } from 'dicopal';

// GeoJSON types
import type { FeatureCollection, MultiLineString } from 'geojson';

// Helpers
import d3 from './d3-custom';
import worldLand from './world-land';
import topojson from './topojson';
import { DataType, VariableType } from './typeDetection';

// Types
import {
  type GraticuleParameters,
  type LayerDescription,
  RepresentationType,
} from '../global';

export const generateIdLayer = () => `Layer-${uuidv4()}`;

export const generateIdTable = () => `Table-${uuidv4()}`;

export const findLayerById = (
  layersDescription: LayerDescription[],
  id: string,
): LayerDescription | undefined => layersDescription.find((layer) => layer.id === id);

/**
 * Whether the map already has a sphere layer.
 *
 * @param {LayerDescription[]} layersDescription
 * @returns {boolean}
 */
export const alreadyHasSphere = (
  layersDescription: LayerDescription[],
): boolean => layersDescription.some((layer: LayerDescription) => layer.representationType === 'sphere');

/**
 * Whether the map already has a graticule layer.
 *
 * @param {LayerDescription[]} layersDescription
 * @returns {boolean}
 */
export const alreadyHasGraticule = (
  layersDescription: LayerDescription[],
): boolean => layersDescription.some((layer: LayerDescription) => layer.representationType === 'graticule');

export const makeDefaultWorldLand = (): LayerDescription => ({
  type: 'polygon',
  id: generateIdLayer().replace('Layer-', 'Layer-default-world-'),
  name: 'World land',
  visible: true,
  strokeColor: '#d1d1d1',
  strokeWidth: 1,
  strokeOpacity: 1,
  fillColor: '#d1d1d1',
  fillOpacity: 1,
  dropShadow: null,
  shapeRendering: 'auto',
  fields: [
    {
      name: 'id',
      dataType: DataType.string,
      type: VariableType.identifier,
      hasMissingValues: false,
    },
  ],
  representationType: 'default' as RepresentationType,
  data: ( // We know types are correct here, so we just use 'never' to avoid type checking
    topojson.feature(worldLand as never, worldLand.objects.world_country as never)
  ) as unknown as FeatureCollection,
});

export const makeDefaultSphere = (): LayerDescription => ({
  type: 'polygon',
  id: generateIdLayer(),
  name: 'Sphere',
  visible: true,
  strokeColor: '#808080',
  strokeWidth: 1,
  strokeOpacity: 1,
  fillColor: '#e8e8f6',
  fillOpacity: 1,
  dropShadow: null,
  shapeRendering: 'auto',
  fields: [],
  representationType: 'sphere' as RepresentationType,
  data: { type: 'Sphere' } as never,
});

export const makeDefaultGraticule = (): LayerDescription => ({
  type: 'linestring',
  id: generateIdLayer(),
  name: 'Graticule',
  visible: true,
  strokeColor: '#808080',
  strokeWidth: 1,
  strokeOpacity: 0.3,
  strokeDasharray: '5 5',
  dropShadow: null,
  shapeRendering: 'auto',
  representationType: 'graticule' as RepresentationType,
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
  fields: [
    {
      name: 'id',
      dataType: DataType.string,
      type: VariableType.identifier,
      hasMissingValues: false,
    },
  ],
  rendererParameters: {
    step: [20, 20],
  } as GraticuleParameters,
});

export const getDefaultRenderingParams = (geomType: string) : Partial<LayerDescription> => {
  const pal = getPalette('Vivid', 10)!.colors;
  const color = pal[Math.floor(Math.random() * pal.length)];

  if (geomType === 'point') {
    return {
      representationType: 'default' as RepresentationType,
      strokeColor: '#212121',
      strokeWidth: 1,
      strokeOpacity: 1,
      fillColor: color,
      fillOpacity: 1,
      symbolSize: 10,
      symbolType: 'diamond',
      dropShadow: null,
    };
  }
  if (geomType === 'linestring') {
    return {
      representationType: 'default' as RepresentationType,
      strokeColor: color,
      strokeWidth: 1.5,
      strokeOpacity: 1,
      dropShadow: null,
    };
  }
  if (geomType === 'polygon') {
    return {
      representationType: 'default' as RepresentationType,
      strokeColor: '#212121',
      strokeWidth: 0.4,
      strokeOpacity: 1,
      fillColor: color,
      fillOpacity: 0.85,
      dropShadow: null,
    };
  }
  return {};
};
