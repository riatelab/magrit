import * as t1 from 'topojson-server';
import * as t2 from 'topojson-client';
import * as t3 from 'topojson-simplify';

import type { GeoJSONFeatureCollection } from '../global';

const topojson = {
  ...t1,
  ...t2,
  ...t3,
};

/**
 * Convert a GeoJSON FeatureCollection to a TopoJSON file in order to apply quantization
 * then convert it back to a GeoJSON FeatureCollection.
 *
 * @param {GeoJSONFeatureCollection} geojson
 * @param {number} quantization
 */
export const convertToTopojsonQuantizeAndBackToGeojson = (
  geojson: GeoJSONFeatureCollection,
  quantization: number = 1e5,
): GeoJSONFeatureCollection => {
  const topology = topojson.topology({ collection: geojson }, quantization);
  return topojson.feature(topology, topology.objects.collection) as GeoJSONFeatureCollection;
};

/**
 * Simplify a TopoJSON file, using the quantile method to determine the minimum weight.
 *
 * @param {object} topology
 * @param {number} tolerance
 */
export const simplifyTopojson = (topology: object, tolerance: number) => {
  const presimplified = topojson.presimplify(topology);
  const minWeight = topojson.quantile(presimplified, tolerance);
  return topojson.simplify(presimplified, minWeight);
};

export const convertToTopojsonSimplifyAndBackToGeojson = (
  geojson: any,
  quantization:number = 1e5,
  tolerance: number = 1e-5,
) => {
  const topology = topojson.topology({ collection: geojson }, quantization);
  const simplified = simplifyTopojson(topology, tolerance);
  return topojson.feature(simplified, simplified.objects.collection);
};

export const extractMeshAndMergedPolygonToGeojson = (
  geojson: any,
  quantization: number = 1e6,
) => {
  const topology = topojson.topology({ collection: geojson }, quantization);
  const mesh = topojson.mesh(topology, topology.objects.collection);
  const polygons = topojson.merge(topology, topology.objects.collection.geometries);
  return {
    mesh,
    polygons,
  };
};

/**
 * Convert a TopoJSON file to a GeoJSON FeatureCollections
 * (one FeatureCollection per layer - as many layers as there are objects in the TopoJSON file).
 *
 * @param {string} topojsonFile - The TopoJSON file to convert
 * @returns {{[key in string]: GeoJSONFeatureCollection}} The converted GeoJSON FeatureCollections
 */
export const convertTopojsonToGeojson = (
  topojsonFile: string,
): { [key in string]: GeoJSONFeatureCollection } => {
  const layers: { [key in string]: GeoJSONFeatureCollection } = {};
  const topo = JSON.parse(topojsonFile);
  Object.keys(topo.objects)
    .forEach((layerName: string) => {
      const layer = topojson.feature(topo, topo.objects[layerName]);
      layers[layerName] = layer;
    });
  return layers;
};

export default topojson;
