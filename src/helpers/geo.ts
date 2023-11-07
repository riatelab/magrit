// Imports from external libraries
import {
  area, booleanPointInPolygon, nearestPoint, pointOnFeature,
} from '@turf/turf';
import * as polylabel from 'polylabel';

// Helpers
import d3 from './d3-custom';
import {
  Mabs,
  max,
  Mfloor,
  Mlog10,
  Mmax,
  Mpow,
  Msqrt,
  round,
} from './math';
import {
  ascending,
  descending,
  getNumberOfDecimals,
  isNumber,
} from './common';

// Stores
import { globalStore } from '../store/GlobalStore';

// Types / Interfaces / Enums
import { GeoJSONFeature, type GeoJSONGeometry, ProportionalSymbolsSymbolType } from '../global.d';

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

export class PropSizer {
  private fixedValue: number;

  private fixedSize: number;

  private smax: number;

  public scale: (val: number) => number;

  public getValue: (size: number) => number;

  constructor(fixedValue: number, fixedSize: number, symbolType: ProportionalSymbolsSymbolType) {
    this.fixedValue = fixedValue;
    this.fixedSize = fixedSize;
    /* eslint-disable no-mixed-operators */
    if (symbolType === ProportionalSymbolsSymbolType.circle) {
      const { PI } = Math;
      this.smax = fixedSize * fixedSize * PI;
      this.scale = (val: number) => Msqrt(Mabs(val) * this.smax / this.fixedValue) / PI;
      this.getValue = (size: number) => ((size * PI) ** 2) / this.smax * this.fixedValue;
    } else if (symbolType === ProportionalSymbolsSymbolType.line) {
      this.smax = fixedSize;
      this.scale = (val: number) => Mabs(val) * this.smax / this.fixedValue;
      this.getValue = (size: number) => size / this.smax * this.fixedValue;
    } else { // symbolType === ProportionalSymbolsSymbolType.square
      this.smax = fixedSize * fixedSize;
      this.scale = (val: number) => Msqrt(Mabs(val) * this.smax / this.fixedValue);
      this.getValue = (size: number) => (size ** 2) / this.smax * this.fixedValue;
    }
    /* eslint-enable no-mixed-operators */
  }
}

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

interface SimulationNode {
  x: number,
  y: number,
  size: number | null,
  padding: number,
  index: number,
}

/* eslint-disable */
function squareForceCollide() {
  let nodes: SimulationNode[];

  function force(alpha) {
    const quad = d3.quadtree(
      nodes,
      (d) => d.x,
      (d) => d.y,
    );
    nodes.forEach((d) => {
      quad.visit((q, x1, y1, x2, y2) => {
        let updated = false;
        if (q.data && q.data !== d) {
          let x = d.x - q.data.x;
          let y = d.y - q.data.y;
          const xSpacing = d.padding + (q.data.size + d.size) / 2;
          const ySpacing = d.padding + (q.data.size + d.size) / 2;
          const absX = Math.abs(x);
          const absY = Math.abs(y);
          let l;
          let lx;
          let ly;

          if (absX < xSpacing && absY < ySpacing) {
            l = Math.sqrt(x * x + y * y);
            lx = (absX - xSpacing) / l;
            ly = (absY - ySpacing) / l;

            // the one that's barely within the bounds probably triggered the collision
            if (Math.abs(lx) > Math.abs(ly)) {
              lx = 0;
            } else {
              ly = 0;
            }
            d.x -= x *= lx;
            d.y -= y *= ly;
            q.data.x += x;
            q.data.y += y;

            updated = true;
          }
        }
        return updated;
      });
    });
  }

  force.initialize = (arg0) => (nodes = arg0);

  return force;
}
/* eslint-enable */

/**
 *
 *
 * @param {GeoJSONFeature[]} features - The features to be simulated
 * @param {string} variableName - The name of the variable used for computing the size of symbols
 * @param {{
 *  referenceValue: number,
 *  referenceSize: number,
 *  symbolType: ProportionalSymbolsSymbolType
 * }} proportionProperty - Which size, on which value, for which kind of symbol
 * @param {number} iterations - The number of iterations for the simulation
 * @param {number} strokeWidth - The stroke width of the symbols
 * @returns {GeoJSONFeature[]} - The features with the computed coordinates
 *                               (wrt the current projection)
 */
export const makeDorlingDemersSimulation = (
  features: GeoJSONFeature[],
  variableName: string,
  proportionProperty: {
    referenceValue: number,
    referenceSize: number,
    symbolType: ProportionalSymbolsSymbolType,
  },
  iterations: number,
  strokeWidth: number,
) => {
  // Util to compute the size of circles, given the
  // reference value and size set by the user
  const propSizer = new PropSizer(
    proportionProperty.referenceValue,
    proportionProperty.referenceSize,
    proportionProperty.symbolType,
  );

  // Extract positions (in projected coordinates) and sizes
  // for the simulation
  const positions: SimulationNode[] = features
    .map((d: GeoJSONFeature, i: number) => ({
      x: globalStore.projection(d.geometry.originalCoordinates)[0],
      y: globalStore.projection(d.geometry.originalCoordinates)[1],
      size: isNumber(d.properties[variableName])
        ? propSizer.scale(d.properties[variableName])
        : null,
      padding: strokeWidth / 2,
      index: i,
    }))
    .filter((d) => d.size !== null);

  // The simulation parameters
  const simulation = d3
    .forceSimulation(positions)
    .force(
      'x',
      d3.forceX((d) => d.x),
    )
    .force(
      'y',
      d3.forceY((d) => d.y),
    )
    .force(
      'collide',
      proportionProperty.symbolType === ProportionalSymbolsSymbolType.circle
        ? d3.forceCollide((d) => d.size! + d.padding)
        : squareForceCollide(),
    );

  // Run the simulation 'iterations' times
  for (let i = 0; i < iterations; i += 1) {
    simulation.tick();
  }

  // Modify the input features with the computed coordinates
  positions.forEach((d) => {
    // eslint-disable-next-line no-param-reassign
    features[d.index].geometry.coordinates = globalStore.projection.invert([d.x, d.y]);
    // eslint-disable-next-line no-param-reassign
    features[d.index].properties.size = d.size;
  });

  return features;
};
