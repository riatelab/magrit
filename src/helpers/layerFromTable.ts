// GeoJSON types
import type { Feature, FeatureCollection } from 'geojson';

// Helpers
import { isFiniteNumber } from './common';
import { wktToGeojson } from './geos';

export const wktSeemsValid = (v: string): boolean => (
  v.startsWith('POINT')
  || v.startsWith('LINESTRING')
  || v.startsWith('POLYGON')
  || v.startsWith('MULTIPOINT')
  || v.startsWith('MULTILINESTRING')
  || v.startsWith('MULTIPOLYGON')
);

export const makeLayerFromTableAndXY = async (
  data: Record<string, unknown>[],
  xField: string,
  yField: string,
): Promise<FeatureCollection> => {
  const layer = {
    type: 'FeatureCollection',
    features: [],
  } as FeatureCollection;

  const keys = Object.keys(data[0])
    .filter((key) => key !== xField && key !== yField);

  data.forEach((row) => {
    if (
      isFiniteNumber(row[xField])
      && isFiniteNumber(row[yField])
    ) {
      const properties = keys
        .reduce((acc, key) => {
          acc[key] = row[key];
          return acc;
        }, {} as Record<string, unknown>);
      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [row[xField] as number, row[yField] as number],
        },
        properties,
      };
      layer.features.push(feature as Feature);
    }
  });

  return layer;
};

export const makeLayerFromTableAndWKT = async (
  data: Record<string, unknown>[],
  wktField: string,
): Promise<FeatureCollection> => {
  const layer = {
    type: 'FeatureCollection',
    features: [],
  } as FeatureCollection;

  const keys = Object.keys(data[0])
    .filter((key) => key !== wktField);

  // eslint-disable-next-line no-restricted-syntax
  for (const row of data) {
    const wkt = row[wktField];
    if (typeof wkt === 'string' && wktSeemsValid(wkt)) {
      const properties = keys
        .reduce((acc, key) => {
          acc[key] = row[key];
          return acc;
        }, {} as Record<string, unknown>);

      try {
        // eslint-disable-next-line no-await-in-loop
        const geometry = await wktToGeojson(wkt);
        layer.features.push({
          type: 'Feature',
          geometry,
          properties,
        } as Feature);
      } catch (e) {
        console.error('Error while converting WKT to GeoJSON', e);
      }
    }
  }

  return layer;
};
