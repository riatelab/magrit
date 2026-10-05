import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type { FeatureCollection } from 'geojson';

import d3 from './d3-custom';
import { clearGeoStitchCache, getGeoStitchedFeatures } from './geoStitchCache';

const makeFeatureCollection = (): FeatureCollection => ({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { id: 1 },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
          [0, 0],
        ]],
      },
    },
  ],
});

afterEach(() => {
  clearGeoStitchCache();
  vi.restoreAllMocks();
});

describe('geoStitchCache', () => {
  it('should reuse stitched features for the same feature collection instance', () => {
    const geoStitchSpy = vi.spyOn(d3, 'geoStitch');
    const featureCollection = makeFeatureCollection();

    const firstResult = getGeoStitchedFeatures(featureCollection);
    const secondResult = getGeoStitchedFeatures(featureCollection);

    expect(firstResult).toBe(secondResult);
    expect(geoStitchSpy).toHaveBeenCalledTimes(1);
  });

  it('should recompute after invalidating one feature collection', () => {
    const geoStitchSpy = vi.spyOn(d3, 'geoStitch');
    const featureCollection = makeFeatureCollection();

    const firstResult = getGeoStitchedFeatures(featureCollection);
    clearGeoStitchCache(featureCollection);
    const secondResult = getGeoStitchedFeatures(featureCollection);

    expect(secondResult).not.toBe(firstResult);
    expect(geoStitchSpy).toHaveBeenCalledTimes(2);
  });

  it('should keep separate cache entries for different feature collection objects', () => {
    const geoStitchSpy = vi.spyOn(d3, 'geoStitch');
    const firstFeatureCollection = makeFeatureCollection();
    const secondFeatureCollection = makeFeatureCollection();

    const firstResult = getGeoStitchedFeatures(firstFeatureCollection);
    const secondResult = getGeoStitchedFeatures(secondFeatureCollection);

    expect(firstResult).not.toBe(secondResult);
    expect(geoStitchSpy).toHaveBeenCalledTimes(2);
  });
});
