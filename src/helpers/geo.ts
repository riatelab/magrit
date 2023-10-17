// Imports from external libraries
import {
  area, booleanPointInPolygon, nearestPoint, pointOnFeature,
} from '@turf/turf';
import * as polylabel from 'polylabel';

// Helpers
import d3 from './d3-custom';
import {
  max,
  Mfloor,
  Mlog10, Mmax, Mpow, Msqrt, round,
} from './math';
import { ascending, descending, getNumberOfDecimals } from './common';

// Types / Interfaces / Enums
import { type GeoJSONGeometry, ProportionalSymbolsSymbolType } from '../global.d';

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

export const coordsPointOnFeature = (geom: GeoJSONGeometry) => {
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
    return pointOnFeature({ type: 'Feature', geometry: geom, properties: {} }).geometry.coordinates;
  }
  // Implement our logic for polygon centroid, or inaccessibility pole or nearest point
  // to centroid on polygon boundary
  if (geom.type.includes('Polygon')) {
    // Take the largest Polygon if MultiPolygon
    const tGeom = geom.type.includes('Multi')
      ? getLargestPolygon(geom)
      : geom;
    // Compute centroid
    const centroid = d3.geoCentroid(tGeom as never);
    // Return centroid coordinates if they are inside the target polygon ...
    if (booleanPointInPolygon(centroid, tGeom as never, { ignoreBoundary: true })) {
      return centroid;
    }
    // Otherwise compute the inaccessibility pole
    const inaccessibilityPole = polylabel(tGeom.coordinates, 1.0);
    // Return inaccessibility pole if it lies inside the target polygon
    if (booleanPointInPolygon(inaccessibilityPole, tGeom as never, { ignoreBoundary: true })) {
      return inaccessibilityPole;
    }
    // Otherwise compute the nearest point to the centroid on
    // the exterior ring of the target polygon (as with turf/pointOnFeature)
    // and return it
    const vertices = {
      type: 'FeatureCollection',
      features: (tGeom.coordinates[0] as unknown as number[][]).map((c: number[]) => ({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: c,
        },
      })),
    };
    return nearestPoint(centroid, vertices as never).geometry.coordinates;
  }
  return null;
};

/* eslint-disable no-mixed-operators */
export const PropSizer = function PropSizer(
  this: any,
  fixedValue: number,
  fixedSize: number,
  symbolType: ProportionalSymbolsSymbolType,
) {
  this.fixedValue = fixedValue;
  const { sqrt, abs } = Math;
  if (symbolType === ProportionalSymbolsSymbolType.circle) {
    const { PI } = Math;
    this.smax = fixedSize * fixedSize * PI;
    this.scale = (val: number) => sqrt(abs(val) * this.smax / this.fixedValue) / PI;
    this.getValue = (size: number) => ((size * PI) ** 2) / this.smax * this.fixedValue;
  } else if (symbolType === ProportionalSymbolsSymbolType.line) {
    this.smax = fixedSize;
    this.scale = (val: number) => abs(val) * this.smax / this.fixedValue;
    this.getValue = (size: number) => size / this.smax * this.fixedValue;
  } else { // symbolType === ProportionalSymbolsSymbolType.square
    this.smax = fixedSize * fixedSize;
    this.scale = (val: number) => sqrt(abs(val) * this.smax / this.fixedValue);
    this.getValue = (size: number) => (size ** 2) / this.smax * this.fixedValue;
  }
}; /* eslint-enable no-mixed-operators */

export const computeCandidateValuesForSymbolsLegend = (
  minValue: number,
  maxValue: number,
  scaleFn: (arg0: number) => number,
  unScaleFn: (arg0: number) => number,
): number[] => {
  const minSize = scaleFn(minValue);
  const maxSize = scaleFn(maxValue);
  const r = Mmax(getNumberOfDecimals(minSize), getNumberOfDecimals(maxSize));
  const diffSize = Msqrt(maxSize) - Msqrt(minSize);
  const sizeInterm1 = Mpow(Msqrt(minSize) + diffSize * (2.5 / 5), 2);
  const sizeInterm2 = Mpow(Msqrt(minSize) + diffSize * (4 / 5), 2);
  return [
    minValue,
    round(unScaleFn(sizeInterm1), r),
    round(unScaleFn(sizeInterm2), r),
    maxValue,
  ];
};

function filterValues(
  candidates: number[],
  scaleFn: (arg0: number) => number,
  dmin: number = 0,
) {
  // Array that will hold the filtered values
  const filteredValues = [];
  // Add the minimum value
  filteredValues.push(candidates[0]);
  // Remember the height of the previously added value
  let previousHeight = scaleFn(candidates[0]);
  // Find the height and value of the smallest acceptable symbol
  let lastHeight = 0;

  let lastValueId = candidates.length - 1;

  while (lastValueId >= 0) {
    lastHeight = scaleFn(candidates[lastValueId]);
    if (lastHeight > dmin) {
      break;
    }
    lastValueId -= 1;
  }

  // Loop over all values that are large enough
  for (let limitId = 1; limitId <= lastValueId; limitId++) { // eslint-disable-line no-plusplus
    const v = candidates[limitId];
    // Compute the height of the symbol
    const h = scaleFn(v);
    // Do not draw the symbol if it is too close to the smallest symbol
    // (but it is not the smallest limit itself)
    if (((h - lastHeight) < dmin) && (limitId !== lastValueId)) {
      continue; // eslint-disable-line no-continue
    }
    // Do not draw the symbol if it is too close to the previously drawn symbol
    if ((previousHeight - h) < dmin) {
      continue; // eslint-disable-line no-continue
    }
    filteredValues.push(v);
    // Remember the height of the last drawn symbol
    previousHeight = h;
  }

  return filteredValues.sort(ascending);
}

/**
 * Reference: Self-Adjusting Legends for Proportional Symbol Maps,
 * by Bernhard Jenny, Ernst Hutzler, and Lorenz Hurni (2009).
 *
 * @param {number} minValue
 * @param {number} maxValue
 * @param {(arg0: number) => number} scaleFn
 */
export function computeCandidateValues(
  minValue: number,
  maxValue: number,
  scaleFn: (arg0: number) => number,
) {
  const bases = [5, 2.5, 1];
  const candidates = [];
  let baseId = 0;
  let scale = 1;
  let minS = minValue;
  let maxS = maxValue;

  while (minS < 1) {
    minS *= 10;
    maxS *= 10;
    scale /= 10;
  }

  let nDigits = Mfloor(Mlog10(maxS));
  for (let i = 0; i < bases.length; i++) { // eslint-disable-line no-plusplus
    if ((maxS / 10 ** nDigits) >= bases[i]) {
      baseId = i;
      break;
    }
  }

  while (true) {
    const v = bases[baseId] * 10 ** nDigits;
    if (v <= minS) {
      break;
    }
    candidates.push(v / scale);
    baseId += 1;
    if (baseId === bases.length) {
      baseId = 0;
      nDigits -= 1;
    }
  }

  candidates.sort(descending);
  candidates[0] = maxValue;

  return [
    minValue,
    ...filterValues(candidates, scaleFn, 6),
  ];
}
