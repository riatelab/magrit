import * as t1 from 'topojson-server';
import * as t2 from 'topojson-client';
import * as t3 from 'topojson-simplify';

const topojson = {
  ...t1,
  ...t2,
  ...t3,
};

export const convertToTopojsonQuantizeAndBackToGeojson = (
  geojson: any,
  quantization: number = 1e5,
) => {
  const topology = topojson.topology({ collection: geojson }, quantization);
  return topojson.feature(topology, topology.objects.collection);
};

export const convertToTopojsonSimplifyAndBackToGeojson = (
  geojson: any,
  quantization:number = 1e5,
  tolerance: number = 1e-5,
) => {
  const topology = topojson.topology({ collection: geojson }, quantization);
  const simplified = topojson.simplify(topology, tolerance);
  return topojson.feature(simplified, simplified.objects.collection);
};

export const extractMeshAndMergedPolygonToGeojson = (
  geojson: any,
  quantization: number = 1e5,
) => {
  const topology = topojson.topology({ collection: geojson }, quantization);
  const mesh = topojson.mesh(topology, topology.objects.collection);
  const polygons = topojson.merge(topology, topology.objects.collection.geometries);
  return {
    mesh,
    polygons,
  };
};

export default topojson;
