import initGeosJs from 'geos-wasm';
import { geojsonToGeosGeom, geosGeomToGeojson } from 'geos-wasm/helpers';

import type { GeoJSONFeature, GeoJSONFeatureCollection} from '../global';

/**
 * Get the geos instance, using the singleton pattern.
 * @returns {Promise<geos>} - The geos instance.
 */
async function getGeos() {
  if (!globalThis.geos) {
    globalThis.geos = await initGeosJs();
  }
  return globalThis.geos;
}

async function intersection(
  layer1: GeoJSONFeatureCollection,
  layer2: GeoJSONFeatureCollection,
) {
  // Get the geos instance
  const geos = await getGeos();
  // We want to clip layer1 with layer2, so we will union all the features of layer2
  // and then use the union to clip each feature of layer1
  const unionPtr = geos.GEOSUnaryUnion(geojsonToGeosGeom(layer2, geos));

  // Clip each feature of layer1 with the union of layer2
  const features = [];
  for (let i = 0; i < layer1.features.length; i += 1) {
    const ft = layer1.features[i];
    // Pointer to the clipped feature
    const clippedPtr = geos.GEOSIntersection(
      geojsonToGeosGeom(ft, geos),
      unionPtr,
    );
    // Convert back to geojson and add to the result array
    features.push({
      type: 'Feature',
      id: ft.id,
      properties: ft.properties,
      geometry: geosGeomToGeojson(clippedPtr, geos),
    } as GeoJSONFeature);
    // Destroy the clipped feature
    geos.GEOSGeom_destroy(clippedPtr);
  }

  // Destroy the union
  geos.GEOSGeom_destroy(unionPtr);

  // Build the resulting feature collection
  return {
    type: 'FeatureCollection',
    features,
  };
}

export {
  intersection,
};

export default getGeos();
