import type {
  Feature,
  FeatureCollection,
  Geometry,
} from 'geojson';

import d3 from './d3-custom';

type GeoStitchInput = FeatureCollection;
type GeoStitchedFeature = Feature<Geometry | null, Record<string, unknown>>;

let geoStitchCache = new WeakMap<object, readonly GeoStitchedFeature[]>();

/**
 * Return stitched polygon features for a given feature collection.
 *
 * The cache intentionally lives outside the reactive stores:
 * - original data remain untouched,
 * - derived stitched geometries are computed lazily,
 * - entries can be garbage-collected when the source dataset is no longer referenced.
 */
function getGeoStitchedFeatures(
  featureCollection: GeoStitchInput,
): readonly GeoStitchedFeature[] {
  const cached = geoStitchCache.get(featureCollection as object);
  if (cached) {
    return cached;
  }

  const stitchedFeatures = d3.geoStitch(featureCollection).features as GeoStitchedFeature[];
  geoStitchCache.set(featureCollection as object, stitchedFeatures);
  return stitchedFeatures;
}

/**
 * Invalidate the cache for one feature collection or reset the whole cache.
 */
function clearGeoStitchCache(featureCollection?: GeoStitchInput) {
  if (featureCollection) {
    geoStitchCache.delete(featureCollection as object);
    return;
  }
  geoStitchCache = new WeakMap<object, readonly GeoStitchedFeature[]>();
}

export {
  clearGeoStitchCache,
  getGeoStitchedFeatures,
};
