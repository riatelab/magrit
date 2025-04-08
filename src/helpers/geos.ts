import type { Feature, FeatureCollection, Geometry } from 'geojson';
import initGeosJs from 'geos-wasm';
import { geojsonToGeosGeom, geosGeomToGeojson } from 'geos-wasm/helpers';

/**
 * Get the geos instance, using the singleton pattern.
 * @returns {Promise<geos>} - The geos instance.
 */
async function getGeos() {
  // If the geos instance is not already defined, we initialize it
  if (!globalThis.geos) {
    globalThis.geos = await initGeosJs();
  }
  // Return the geos instance
  return globalThis.geos;
}

async function intersectionFeature(
  feature1: Feature,
  feature2: Feature,
): Promise<Feature<Geometry, Record<string, unknown>> | null> {
  const geos = await getGeos();

  const ft1Ptr = geojsonToGeosGeom(feature1, geos);
  const ft2Ptr = geojsonToGeosGeom(feature2, geos);
  const intersectionPtr = geos.GEOSIntersection(ft1Ptr, ft2Ptr);
  const geometry = geosGeomToGeojson(intersectionPtr, geos);
  geos.GEOSGeom_destroy(ft1Ptr);
  geos.GEOSGeom_destroy(ft2Ptr);
  geos.GEOSGeom_destroy(intersectionPtr);

  // If the intersection is empty, the coordinates array will be empty
  // and we choose to return null (to avoid features with empty geometry
  // in the caller functions)
  if (!geometry || !geometry.coordinates || geometry.coordinates.length === 0) {
    return null;
  }

  return {
    type: 'Feature',
    id: feature1.id,
    properties: feature1.properties || {},
    geometry,
  } as Feature;
}

/**
 * Compute the intersection of a GeoJSON feature collection (layer1) with
 * the union of the features of another GeoJSON feature collection (layer2).
 *
 * @param {FeatureCollection} layer1 - The layer to clip.
 * @param {FeatureCollection} layer2 - The clipping layer (takes the union of its features).
 * @param {boolean} [bufferTrick=false] - Whether to use the buffer trick to
 *                                        try to repair invalid geometries.
 */
async function intersectionLayer(
  layer1: FeatureCollection,
  layer2: FeatureCollection,
  bufferTrick: boolean = false,
) {
  // Get the geos instance
  const geos = await getGeos();
  // We want to clip layer1 with layer2, so we will union all the features of layer2
  // and then use the union to clip each feature of layer1
  const geomsPtr = geojsonToGeosGeom(layer2, geos);
  const unionPtr = geos.GEOSUnaryUnion(geomsPtr);

  let clippingGeom;

  if (bufferTrick) {
    // In order to repair invalid geometries and topology issues
    // we can buffer the union before clipping the features of layer1
    // (note that the buffer width is in the unit of the dataset, so degrees).
    const bufferPtr1 = geos.GEOSBuffer(unionPtr, 0.0000091, 1); // about 1 meter
    clippingGeom = geos.GEOSBuffer(bufferPtr1, -0.0000091, 8);
    geos.GEOSGeom_destroy(bufferPtr1);
    geos.GEOSGeom_destroy(unionPtr);
  } else {
    clippingGeom = unionPtr;
  }

  // Clip each feature of layer1 with the union of layer2
  const features = [];
  for (let i = 0; i < layer1.features.length; i += 1) {
    const ft = layer1.features[i];
    // Pointer to the clipped feature
    const clippedPtr = geos.GEOSIntersection(
      geojsonToGeosGeom(ft, geos),
      clippingGeom,
    );
    // Convert back to GeoJSON
    const geometry = geosGeomToGeojson(clippedPtr, geos);

    // Coordinates array may be empty if the intersection is empty
    // (so we only push the feature if it's not empty)
    if (geometry.coordinates.length > 0) {
      features.push({
        type: 'Feature',
        id: ft.id,
        properties: ft.properties,
        geometry,
      } as Feature);
    }
    // Destroy the clipped feature
    geos.GEOSGeom_destroy(clippedPtr);
  }

  // Destroy the geoms of layer2
  geos.GEOSGeom_destroy(geomsPtr);
  // Destroy the union of geoms of layer2
  geos.GEOSGeom_destroy(clippingGeom);

  // Build the resulting feature collection
  return {
    type: 'FeatureCollection',
    features,
  };
}

async function makeValid(feature: Geometry) {
  const geos = await getGeos();
  const geomPtr = geojsonToGeosGeom(feature, geos);
  const validGeomPtr = geos.GEOSMakeValid(geomPtr);
  const validGeom = geosGeomToGeojson(validGeomPtr, geos);
  geos.GEOSGeom_destroy(geomPtr);
  geos.GEOSGeom_destroy(validGeomPtr);
  return validGeom;
}

async function wktToGeojson(wkt: string) {
  const geos = await getGeos();
  const reader = geos.GEOSWKTReader_create();
  const size = wkt.length + 1;
  // eslint-disable-next-line no-underscore-dangle
  const wktPtr = geos.Module._malloc(size);
  geos.Module.stringToUTF8(wkt, wktPtr, size);
  const geomPtr = geos.GEOSWKTReader_read(reader, wktPtr);
  // eslint-disable-next-line no-underscore-dangle
  geos.Module._free(wktPtr);
  const geometry = geosGeomToGeojson(geomPtr, geos);
  geos.GEOSGeom_destroy(geomPtr);
  geos.GEOSWKTReader_destroy(reader);
  return geometry;
}

export {
  intersectionFeature,
  intersectionLayer,
  makeValid,
  wktToGeojson,
};

export default getGeos;
