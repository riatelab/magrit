// Imports from external libraries
import {
  area,
  booleanPointInPolygon,
  lineIntersect,
  nearestPoint,
  pointOnFeature,
} from '@turf/turf';
import polylabel from 'polylabel';

// Helpers
import d3 from './d3-custom';
import {
  degToRadConstant,
  Mabs,
  Macos,
  max,
  min,
  Mcos,
  Mfloor,
  Mlog10,
  Mmax,
  Mpow,
  Msin,
  Msqrt,
  round,
} from './math';
import {
  ascending,
  descending,
  getNumberOfDecimals,
  isNumber,
} from './common';
import { makeValid } from './geos';

// Stores
import { globalStore } from '../store/GlobalStore';

// Types / Interfaces / Enums
import {
  GeoJSONFeature,
  GeoJSONFeatureCollection,
  type GeoJSONGeometry,
  GeoJSONGeometryType,
  GeoJSONPosition,
  ProportionalSymbolsSymbolType,
} from '../global.d';

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

export const makeCentroidLayer = (
  layer: GeoJSONFeatureCollection,
  type: 'point' | 'linestring' | 'polygon',
  fields?: string[],
): GeoJSONFeatureCollection => {
  // Copy the dataset
  const newData = JSON.parse(JSON.stringify(layer)) as GeoJSONFeatureCollection;

  // Compute the centroid of each feature
  if (type !== 'point') {
    newData.features.forEach((feature) => {
      // eslint-disable-next-line no-param-reassign
      feature.geometry = {
        type: 'Point',
        coordinates: coordsPointOnFeature(feature.geometry),
      };

      if (fields) {
        const o = {};
        fields.forEach((field) => {
          // eslint-disable-next-line no-param-reassign
          o[field] = feature.properties[field];
        });
        feature.properties = o; // eslint-disable-line no-param-reassign
      }
    });
  }

  // Only keep the requested fields if a list of fields is provided
  // (otherwise keep all fields)
  if (fields) {
    newData.features.forEach((feature) => {
      const o = {};
      fields.forEach((field) => {
        // eslint-disable-next-line no-param-reassign
        o[field] = feature.properties[field];
      });
      feature.properties = o; // eslint-disable-line no-param-reassign
    });
  }

  return newData;
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
  n: 3 | 4 | 5 = 4,
): number[] => {
  const minSize = scaleFn(minValue);
  const maxSize = scaleFn(maxValue);
  const r = Mmax(getNumberOfDecimals(minSize), getNumberOfDecimals(maxSize));
  const diffSize = Msqrt(maxSize) - Msqrt(minSize);
  const sizeInterm1 = Mpow(Msqrt(minSize) + diffSize * (2.5 / 5), 2);
  const sizeInterm2 = Mpow(Msqrt(minSize) + diffSize * (4 / 5), 2);
  if (n === 3) {
    return [
      minValue,
      round(unScaleFn((sizeInterm1 + sizeInterm2) / 2), r),
      maxValue,
    ];
  }
  if (n === 4) {
    return [
      minValue,
      round(unScaleFn(sizeInterm1), r),
      round(unScaleFn(sizeInterm2), r),
      maxValue,
    ];
  }
  const sizeInterm3 = Mpow(Msqrt(minSize) + diffSize * (3 / 5), 2);
  return [
    minValue,
    round(unScaleFn(sizeInterm1), r),
    round(unScaleFn(sizeInterm2), r),
    round(unScaleFn(sizeInterm3), r),
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

  function force(alpha: number) {
    const quad = d3.quadtree(
      nodes,
      (d) => d.x,
      (d) => d.y,
    );
    nodes.forEach((d) => {
      quad.visit((q: any & { data: SimulationNode }, x1, y1, x2, y2) => {
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

  force.initialize = (arg0: any) => (nodes = arg0);

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
): GeoJSONFeature[] => {
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

export const countCoordinates = (geometry: GeoJSONGeometryType): number => {
  if (geometry.type === 'Point') {
    return 1;
  }
  if (geometry.type === 'MultiPoint') {
    return geometry.coordinates.length;
  }
  if (geometry.type === 'LineString') {
    return geometry.coordinates.length;
  }
  if (geometry.type === 'MultiLineString') {
    return geometry.coordinates.reduce((acc, c) => acc + c.length, 0);
  }
  if (geometry.type === 'Polygon') {
    let nb = 0;
    for (let i = 0; i < geometry.coordinates.length; i += 1) {
      nb += geometry.coordinates[i].length;
    }
    return nb;
  }
  if (geometry.type === 'MultiPolygon') {
    let nb = 0;
    for (let i = 0; i < geometry.coordinates.length; i += 1) {
      for (let j = 0; j < geometry.coordinates[i].length; j += 1) {
        nb += geometry.coordinates[i][j].length;
      }
    }
    return nb;
  }
  if (geometry.type === 'GeometryCollection') {
    return geometry.geometries.reduce((acc, g) => acc + countCoordinates(g), 0);
  }
  return 0;
};

const equalPoints = (
  a: number[] | GeoJSONPosition,
  b: number[] | GeoJSONPosition,
): boolean => a[0] === b[0] && a[1] === b[1];

const cleanConsecutiveIdenticalPoints = (
  coords: number[][] | GeoJSONPosition[],
): GeoJSONPosition[] => {
  const newCoords = [coords[0]];
  for (let i = 1; i < coords.length; i += 1) {
    if (!equalPoints(coords[i], coords[i - 1])) {
      newCoords.push(coords[i]);
    }
  }
  return newCoords
    .filter((d) => !Number.isNaN(d[0]) || !Number.isNaN(d[1])) as GeoJSONPosition[];
};

const cleanRing = (
  ring: GeoJSONPosition[] | number[][],
): GeoJSONPosition[] | null => {
  const newRing = cleanConsecutiveIdenticalPoints(ring);
  if (newRing.length > 2) {
    if (equalPoints(newRing[0], newRing[newRing.length - 1])) {
      return newRing;
    }
    // Close the ring
    newRing.push(newRing[0]);
    return newRing;
  }
  return null;
};

/**
 * Clean a GeoJSON geometry by removing (consecutive, excepted for MultiPoints) identical points.
 * If a geometry is empty after cleaning (less than 2 points for a line,
 * less than 3 points for a Polygon), it is removed
 * and the function returns null (which is valid in the geometry
 * field of a GeoJSON feature according to RFC 7946).
 *
 * TODO: better check geometry validity (closing polygons, etc.)
 * TODO: check for points that may create a "flat" polygon
 * TODO: explain why we cant use turf cleanCoords function and the difference in implementation.
 * TODO: investigate using geos-wasm geos.GEOSMakeValid (but it may be too costly)
 *
 * @param geometry
 */
export const cleanGeometry = (geometry: GeoJSONGeometryType): GeoJSONGeometryType | null => {
  if (geometry.type === 'Point') {
    if (geometry.coordinates.length >= 2) {
      return geometry;
    }
    return null;
  }
  if (geometry.type === 'MultiPoint') {
    if (geometry.coordinates.length > 0) {
      // Remove identical points, whether they are consecutive or not
      const newCoords = [geometry.coordinates[0]];
      for (let i = 1; i < geometry.coordinates.length; i += 1) {
        let found = false;
        for (let j = 0; j < newCoords.length; j += 1) {
          if (equalPoints(geometry.coordinates[i], newCoords[j])) {
            found = true;
            break;
          }
        }
        if (!found) {
          newCoords.push(geometry.coordinates[i]);
        }
      }
      return {
        type: 'MultiPoint',
        coordinates: newCoords,
      };
    }
    return null;
  }
  if (geometry.type === 'LineString') {
    if (geometry.coordinates.length > 1) {
      // Remove consecutive identical points
      const newCoords = cleanConsecutiveIdenticalPoints(geometry.coordinates);
      if (newCoords.length > 1) {
        return {
          type: 'LineString',
          coordinates: newCoords,
        };
      }
      return null;
    }
    return null;
  }
  if (geometry.type === 'MultiLineString') {
    if (geometry.coordinates.length > 0) {
      // Remove consecutive identical points
      const newCoords = geometry.coordinates
        .map((coords) => cleanConsecutiveIdenticalPoints(coords));
      if (newCoords.some((c) => c.length > 1)) {
        return {
          type: 'MultiLineString',
          coordinates: newCoords.filter((c) => c.length > 1),
        };
      }
    }
    return null;
  }
  if (geometry.type === 'Polygon') {
    if (geometry.coordinates.length > 0) {
      // Remove consecutive identical points
      // console.log('Points before (exterior ring)', geometry.coordinates[0].length);
      const newCoords = geometry.coordinates
        .map((ring) => cleanRing(ring));
      const [externalRing, ...internalRings] = newCoords;
      // console.log('Points after (exterior ring)', externalRing.length);
      if (geometry.coordinates[0].length !== externalRing.length) {
        console.log('Cleaning did something..');
      }
      if (externalRing) {
        if (internalRings.length > 0) {
          if (internalRings.some((c) => c.length > 2)) {
            return {
              type: 'Polygon',
              coordinates: [externalRing, ...internalRings.filter((c) => c && c.length > 2)],
            };
          }
          return {
            type: 'Polygon',
            coordinates: [externalRing],
          };
        }
        return {
          type: 'Polygon',
          coordinates: [externalRing],
        };
      }
      return null;
    }
    return null;
  }
  if (geometry.type === 'MultiPolygon') {
    if (geometry.coordinates.length > 0) {
      // Remove consecutive identical points
      const newCoords = geometry.coordinates
        .map((poly) => poly
          .map((ring) => cleanRing(ring)));

      if (newCoords.some((c) => c[0].length > 2)) {
        return {
          type: 'MultiPolygon',
          coordinates: newCoords.filter((c) => c[0].length > 2),
        };
      }
      return null;
    }
    return null;
  }
  if (geometry.type === 'GeometryCollection') {
    const newGeometries = geometry.geometries
      .map((g) => cleanGeometry(g))
      .filter((g) => g !== null);
    if (newGeometries.length > 0) {
      return {
        type: 'GeometryCollection',
        geometries: newGeometries,
      };
    }
    return null;
  }
  return null;
};

export const cleanGeometryGeos = async (
  geometry: GeoJSONGeometryType,
): Promise<GeoJSONGeometryType | null> => {
  // We use geos make valid to clean the geometry
  // but we have to be careful with the result...
  const geom = await makeValid(geometry as any);

  // Count the number of vertices before and after cleaning
  const count = {
    before: countCoordinates(geometry),
    after: countCoordinates(geom),
  };
  if (count.before !== count.after) {
    console.log('Cleaning geometry with geos-wasm -> Changed the number of vertices', count, geom);
    if (count.after < 4 && geom.type.includes('Polygon')) {
      console.log('Cleaning failed -> not enough points');
      console.log(geometry, geom);
      return null;
    }
  }

  // Sometimes the type of the geometry is changed
  // (e.g. from Polygon to LineString, which we don't want)
  if (
    (geometry.type.includes('Polygon') && !geom.type.includes('Polygon'))
    || (geometry.type.includes('Line') && !geom.type.includes('Line'))
  ) {
    console.log('Cleaning failed -> changed the type of geometry');
    console.log(geometry, geom);
    // Sometimes we also get a GeometryCollection
    // containing the wanted polygon + some other geometries such as MultiPoint for example.
    // If so, we try to extract the wanted (multi)polygon or the wanted (multi)linestring
    if (geom.type === 'GeometryCollection') {
      const targetType = geometry.type.includes('Polygon')
        ? 'Polygon'
        : 'LineString';
      // If it generated a GeometryCollection, try to extract the
      // appropriate geoms
      const geoms = geom.geometries.filter((g) => g.type.includes(targetType));
      console.log('Geoms', geoms);
      // In the end, we want to avoid GeometryCollections
      // in the dataset we are constructing...
      if (geoms.length > 1) {
        return geoms[0];
        // return {
        //   type: 'GeometryCollection',
        //   geometries: geoms,
        // };
      }
      if (geoms.length === 1) {
        return geoms[0];
      }
      return null;
    }
    return null;
  }
  return geom;
};

export const sphericalLawOfCosine = (
  pt1: [number, number],
  pt2: [number, number],
  radius: number = 6371e3,
) => {
  const [lon1, lat1] = pt1;
  const [lon2, lat2] = pt2;
  const φ1 = lat1 * degToRadConstant;
  const φ2 = lat2 * degToRadConstant;
  const Δλ = (lon2 - lon1) * degToRadConstant;
  return Macos(Msin(φ1) * Msin(φ2) + Mcos(φ1) * Mcos(φ2) * Mcos(Δλ)) * radius;
};

/**
 * Calculates a resolution value adapted to the data set.
 *
 * @param box
 * @param n
 */
export const computeAppropriateResolution = (box: number[], n: number) => {
  const bboxWidth = box[2] - box[0];
  const bboxHeight = box[3] - box[1];
  const bboxArea = bboxWidth * bboxHeight;
  return Math.sqrt(bboxArea / n);
};

function calculatePolygonArea(ring: GeoJSONPosition[]) {
  let areaValue = 0;
  const n = ring.length;
  for (let i = 0; i < n; i += 1) {
    const j = (i + 1) % n;
    areaValue += ring[i][0] * ring[j][1];
    areaValue -= ring[j][0] * ring[i][1];
  }
  return Math.abs(areaValue) / 2.0;
}

export function planarArea(feature: GeoJSONFeature) {
  const { geometry } = feature;
  let areaValue = 0;
  if (geometry.type === 'Polygon') {
    // Calculate area for the outer boundary
    areaValue += calculatePolygonArea(geometry.coordinates[0]);
    // Subtract area for any holes
    for (let i = 1; i < geometry.coordinates.length; i += 1) {
      areaValue -= calculatePolygonArea(geometry.coordinates[i]);
    }
  } else if (geometry.type === 'MultiPolygon') {
    for (let i = 0; i < geometry.coordinates.length; i += 1) {
      const polygon = geometry.coordinates[i];
      // Calculate area for the outer boundary of each polygon
      let polygonArea = calculatePolygonArea(polygon[0]);
      // Subtract area for any holes in each polygon
      for (let j = 1; j < polygon.length; j += 1) {
        polygonArea -= calculatePolygonArea(polygon[j]);
      }
      areaValue += polygonArea;
    }
  }
  return areaValue;
}

const decodeArc = (
  arc: [number, number][],
  transformParams?: { scale: [number, number], translate: [number, number] },
) => {
  if (!transformParams) return arc;
  const ring = [];
  let x = 0;
  let y = 0;
  for (let i = 0; i < arc.length; i += 1) {
    x += arc[i][0];
    y += arc[i][1];
    ring.push([
      x * transformParams.scale[0] + transformParams.translate[0],
      y * transformParams.scale[1] + transformParams.translate[1],
    ]);
  }

  return ring;
};

/**
 * Find intersections between arcs of an object of the given Topology.
 *
 * @param {object} topo - The topology object to use.
 * @param {string} layerName - The name of the layer in the topology object.
 */
export const findIntersections = (
  topo: any,
  layerName: string,
): GeoJSONFeature[] => {
  const layer = topo.objects[layerName];
  // We need to take the arcs from the topology object and check if arcs from one feature
  // intersect with arcs from another feature.
  // Note that we are not interested in the arcs that are shared by two features.
  const features = layer.geometries;
  const intersections: GeoJSONFeature[] = [];
  const flatArcsFeature = features
    .map((ft: any) => ft.arcs.flat(Infinity) // eslint-disable-next-line no-bitwise
      .map((arcIx: number) => (arcIx < 0 ? ~arcIx : arcIx)));
  for (let i = 0; i < flatArcsFeature.length; i += 1) {
    const flatArcs1 = flatArcsFeature[i];
    for (let j = i + 1; j < flatArcsFeature.length; j += 1) {
      if (i === j) continue; // eslint-disable-line no-continue
      const flatArcs2 = flatArcsFeature[j];
      // We need to exclude all shared arcs between the two features
      // (i.e. the arcs that are part of both features).
      // Note that arcs is an array of arrays of indices.
      // Then we take the other arcs and check if they intersect
      // with each other.
      // First, we remove indexes that are part of both features
      const uniqueArcs1 = flatArcs1.filter((arcIx: number) => !flatArcs2.includes(arcIx));
      const uniqueArcs2 = flatArcs2.filter((arcIx: number) => !flatArcs1.includes(arcIx));

      // If they do not share any arc, they are probably not neighbor features
      // so we don't go further to check for intersections.
      // This saves a lot of time but this might be wrong (a dataset with a poor
      // topology might have features that don't share any arc but still intersect -
      // or with island that are close to the coastline).
      if (
        (
          uniqueArcs1.length === flatArcs1.length
          && uniqueArcs2.length === flatArcs2.length
        )
        || uniqueArcs1.length === 0
        || uniqueArcs2.length === 0
      ) {
        continue; // eslint-disable-line no-continue
      }

      // Now we have to check for intersections between the arcs
      // of the two features.
      for (let k = 0; k < uniqueArcs1.length; k += 1) {
        const arc1 = topo.arcs[uniqueArcs1[k]];
        const pts1 = decodeArc(arc1, topo.transform);
        for (let l = 0; l < uniqueArcs2.length; l += 1) {
          if (k === l) continue; // eslint-disable-line no-continue
          const arc2 = topo.arcs[uniqueArcs2[l]];
          const pts2 = decodeArc(arc2, topo.transform);
          // console.log(pts1, pts2);
          // We have to check for intersections between the two arcs
          // and store the result if there is an intersection.
          // We use the intersection function from the topojson library.
          const intersection = lineIntersect(
            { type: 'LineString', coordinates: pts1 },
            { type: 'LineString', coordinates: pts2 },
          );
          if (intersection.features.length > 0) {
            intersection.features.forEach((ft) => {
              if (!(
                equalPoints(ft.geometry.coordinates, pts1[0])
                || equalPoints(ft.geometry.coordinates, pts1[pts1.length - 1])
                || equalPoints(ft.geometry.coordinates, pts2[0])
                || equalPoints(ft.geometry.coordinates, pts2[pts2.length - 1])
              )) {
                // eslint-disable-next-line no-param-reassign
                if (!ft.properties) ft.properties = {};
                // eslint-disable-next-line no-param-reassign
                ft.properties['ID-feature1'] = i;
                // eslint-disable-next-line no-param-reassign
                ft.properties['ID-feature2'] = j;
                intersections.push(ft as GeoJSONFeature);
              }
            });
          }
        }
      }
    }
  }
  return intersections;
};

/**
 * Merge bounding boxes to create a single bounding box that contains all the input bounding boxes.
 * The input bounding boxes are an array of arrays of 4 numbers (xmin, ymin, xmax, ymax).
 *
 * @param {[number, number, number, number][]} bboxes - An array of bounding boxes.
 * @returns {[number, number, number, number]} - The merged bounding box.
 */
export const mergeBboxes = (
  bboxes: [number, number, number, number][],
): [number, number, number, number] => {
  const xmin = min(bboxes.map((b) => b[0]));
  const ymin = min(bboxes.map((b) => b[1]));
  const xmax = max(bboxes.map((b) => b[2]));
  const ymax = max(bboxes.map((b) => b[3]));
  return [xmin, ymin, xmax, ymax];
};
