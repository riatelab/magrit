import {
  area, booleanPointInPolygon, nearestPoint, pointOnFeature,
} from '@turf/turf';
import * as polylabel from 'polylabel';

import d3 from './d3-custom';
import { max } from './math';

import type { GeoJSONGeometry } from '../global';

export const getLargestPolygon = (geom: GeoJSONGeometry) => {
  const areas = [];
  for (let j = 0; j < geom.coordinates.length; j++) { // eslint-disable-line no-plusplus
    areas.push(area({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: geom.coordinates[j],
      },
      properties: {},
    }));
  }
  const ix = areas.indexOf(max(areas));
  return {
    type: 'Polygon',
    coordinates: geom.coordinates[ix],
  };
};

export const coordsPointOnFeature = (geom) => {
  if (!geom) return null;
  if (geom.type === 'Point') {
    // Return the point itself
    return geom.coordinates;
  }
  if (geom.type === 'MultiPoint') {
    // Return the first point of the multipoint
    return geom.coordinates[0];
  }
  if (geom.type.includes('Line')) {
    // Return a point on the line or on the first line if multiline
    return pointOnFeature({ type: 'Feature', geometry: geom }).geometry.coordinates;
  }
  // Implement our logic for polygon centroid, or inaccessibility pole or nearest point
  // to centroid on polygon boundary
  if (geom.type.includes('Polygon')) {
    // Take the largest Polygon if MultiPolygon
    const tGeom = geom.type.includes('Multi')
      ? getLargestPolygon(geom)
      : geom;
    // Compute centroid
    const centroid = d3.geoCentroid(tGeom);
    // Return centroid coordinates if they are inside the target polygon ...
    if (booleanPointInPolygon(centroid, tGeom, { ignoreBoundary: true })) {
      return centroid;
    }
    // Otherwise compute the inaccessibility pole
    const inaccessibilityPole = polylabel(tGeom.coordinates, 1.0);
    // Return inaccessibility pole if it lies inside the target polygon
    if (booleanPointInPolygon(inaccessibilityPole, tGeom, { ignoreBoundary: true })) {
      return inaccessibilityPole;
    }
    // Otherwise compute the nearest point to the centroid on
    // the exterior ring of the target polygon (as with turf/pointOnFeature)
    // and return it
    const vertices = {
      type: 'FeatureCollection',
      features: tGeom.coordinates[0].map((c) => ({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: c,
        },
      })),
    };
    return nearestPoint(centroid, vertices).geometry.coordinates;
  }
  return null;
};
