import proj4, { InterfaceProjection } from 'proj4';
import * as projModule from 'mproj/dist/mproj';
import wkt from 'wkt-parser';
import d3, { type GeoProjection, type GeoRawProjection } from './d3-custom';

import epsg from '../assets/epsg.json';

import type {
  GeoJSONFeature,
  GeoJSONFeatureCollection,
  GeoJSONGeometryType,
  GeoJSONPosition,
} from '../global';

const mproj = projModule.default;

export interface EpsgDbEntryType {
  code: string,
  kind: string,
  name: string,
  bbox: number[],
  wkt: string | null,
  proj4: string | null,
  unit: string | null,
  area: string | null,
  accuracy: number | null,
}

export interface EpsgDbType {
  [key: string]: EpsgDbEntryType
}

// TODO: we should filter out entries with null proj4 string or null wkt
//   directly in the source file to avoid loading a lot of useless data
export const epsgDb: EpsgDbType = Object.fromEntries(
  Object.entries(epsg)
    .filter(([k, v]) => ['CRS-GEOGCRS', 'CRS-PROJCRS'].includes(v.kind) && (v.proj4 || v.wkt))
    .map(([k, v]) => {
      if (v.unit !== null) {
        return [k, v];
      }
      if (v.wkt) {
        const o = wkt(v.wkt);
        if (o.units) {
          return [k, { ...v, unit: o.units as string }];
        }
      }
      return [k, v];
    }) as [string, EpsgDbEntryType][],
) as EpsgDbType;

/**
 * Convert a proj4 string to an object.
 * This is notably used to compare two proj4 strings.
 *
 * @param projString - The string describing the projection.
 * @returns {object} - The proj4 string as an object.
 */
const proj4stringToObj = (projString: string): { [key: string]: string | boolean } => {
  // The resulting obj
  const o: { [key: string]: string | boolean } = {};
  // Split the string into an array of strings and sort by the future key
  // (will allow fast comparison)
  const a = projString.trim().split(' ')
    .map((el) => el.replace('+', '')).sort();
  // Loop over the array and split each element into a key/value pair
  a.forEach((el) => {
    if (el.includes('=')) {
      const [k, v] = el.split('=');
      if (!(k === 'towgs84' && v === '0,0,0,0,0,0,0')) {
        o[k] = v;
      }
    } else {
      const k = el;
      o[k] = true;
    }
  });
  return o;
};

export const getUnitFromProjectionString = (
  projString: string,
): { unit: string | null, toMeter: number | null } => {
  // The projection can be either a proj4 string or a wkt string
  const isProj4 = projString.trim().startsWith('+');
  if (isProj4) {
    const p = proj4stringToObj(projString);
    const r = {};
    r.unit = p.units ? p.units as string : null;
    r.toMeter = p.to_meter ? parseFloat(p.to_meter as string) : null;
    return r;
  }
  // We have a WKT1 string, so the unit, if any,
  // is written like UNIT["name of the unit",value]
  const o = wkt(projString);
  const r = {};
  r.unit = o.units ? o.units as string : null;
  r.toMeter = o.UNIT?.convert ? parseFloat(o.UNIT.convert as string) : null;
  return r;
};

// Those are all the possible distance units that we can encounter
// in a proj4 string or a WKT1 string...
const allPossibleDistanceUnits = [
  'meter', //
  "clarke's link",
  'gold coast foot',
  'us survey foot',
  'foot', //
  "clarke's foot",
  'link',
  'british chain (sears 1922 truncated)',
  'degree',
  'grad',
  "clarke's yard",
  'indian yard',
  'british yard (sears 1922)',
  'german legal metre',
  'british chain (sears 1922)',
  'british foot (sears 1922)',
  'indian yard (1937)',
  '50_kilometers',
  '150_kilometers',
  'chain',
  'm',
  'us-ft',
  'ft',
  'ind-yd',
  'ch',
];

export const getProjectionUnit = (
  projection: any,
): { unit: string | null, isGeo: boolean, toMeter: number } => {
  // TODO: the whole logic of this function is a bit convoluted
  //   we should either simplify it or add comments to explain
  //   (notably because "unit" can be retrieved from the EPSG database
  //    but also from the proj4 string or the WKT1 string - while
  //    the toMeter value can only be retrieved from the proj4/WKT1 string).
  let isGeo;
  let distanceUnit;
  let toMeter;
  if (projection.type === 'd3') {
    isGeo = true;
    distanceUnit = 'degree';
    toMeter = 0.000008983;
  } else { // currentProjection.type === 'proj4'
    let desc;
    if (
      projection.code
      // eslint-disable-next-line no-cond-assign
      && (desc = epsgDb[projection.code.replace('EPSG:', '')])
    ) {
      // We have a code so we can use the EPSG database
      isGeo = (desc as EpsgDbEntryType).unit
        ? (desc as EpsgDbEntryType).unit?.startsWith('degree')
        : true;
      distanceUnit = isGeo ? 'degree' : (desc as EpsgDbEntryType).unit;

      if (distanceUnit === 'degree') {
        toMeter = 0.000008983;
      } else {
        const r = getUnitFromProjectionString(
          (desc as EpsgDbEntryType).wkt || (desc as EpsgDbEntryType).proj4,
        );
        toMeter = r.toMeter ? (1 / r.toMeter) : 1;
      }
    } else {
      // We dont have a code so we need to see in the proj4 string or in the WKT1 string
      const r = getUnitFromProjectionString(projection.value);
      distanceUnit = r.unit;
      isGeo = !distanceUnit || distanceUnit === 'degree';
      toMeter = isGeo // eslint-disable-line no-nested-ternary
        ? 0.000008983
        : r.toMeter
          ? (1 / r.toMeter)
          : 1;
    }
  }

  return {
    unit: distanceUnit,
    isGeo,
    toMeter,
  };
};

/**
 * Parse two proj4 strings and compare if they are equivalent.
 *
 * @param {string} proj1
 * @param {string} proj2
 */
export const projEquals = (proj1: string, proj2: string): boolean => {
  const p1 = proj4stringToObj(proj1);
  const p2 = proj4stringToObj(proj2);
  // Fast comparison between the objects, given the fact the key were sorted
  return JSON.stringify(p1) === JSON.stringify(p2);
};

/**
 * Get a d3 projection from a proj4 projection object.
 *
 * @param {InterfaceProjection} proj - The proj4js projection object.
 * @returns {GeoProjection} - The d3 projection.
 */
export const getD3ProjectionFromProj4 = (proj: InterfaceProjection): GeoProjection => {
  // Create the custom d3 projection using proj 4 forward and inverse functions.
  // Internally, Proj4js and mapshaper-proj uses radians.
  // We just use constant values to convert from degrees to radians and vice versa
  // to avoid capturing any variable from the closure.
  const projRaw: GeoRawProjection = (
    lambda: number,
    phi: number,
  ) => proj.forward([lambda * 57.29577951308232, phi * 57.29577951308232]) as [number, number];

  projRaw.invert = (x: number, y: number): [number, number] => {
    const p = proj.inverse([x, y]);
    return [p[0] * 0.017453292519943295, p[1] * 0.017453292519943295];
  };

  return d3.geoProjection(projRaw);
};

export const getProjection = (projString: string): InterfaceProjection => {
  // TODO: maybe we should resolve EPSG -> proj4 string here
  //  (and throw an error if the EPSG code isn't found)
  // Here we try to read the proj4 string with mapshaper-proj (mpoj)
  // If it fails, we try with proj4js.
  // If it fails again, we throw an error.
  try {
    return proj4(projString);
  } catch (errMproj) {
    // TODO: diagnose why proj4js failed to parse the string
    //   and throw the appropriate error message
    console.log(errMproj);
    try {
      return mproj(projString);
    } catch (errProjJs) {
      // TODO: diagnose why mproj failed to parse the string
      //   and throw the appropriate error message
      console.log(errProjJs);
      // Error messages from proj4js are not very helpful
      // (as they only contains the input string)
      // So we throw a more informative message that will be caught
      // by the caller.
      throw new Error(
        `Failed to instantiate a projection for the following proj4 string: ${projString}`,
      );
    }
  }
};

const reprojGeom = (
  geom: GeoJSONGeometryType,
  projFunc: (a0: [number, number]) => [number, number],
) => {
  if (geom.type === 'Point') {
    // eslint-disable-next-line no-param-reassign
    geom.coordinates = projFunc([geom.coordinates[0], geom.coordinates[1]]) as GeoJSONPosition;
  } else if (geom.type === 'MultiPoint') {
    // eslint-disable-next-line no-param-reassign
    geom.coordinates = geom.coordinates
      .map((coords) => projFunc([coords[0], coords[1]]) as GeoJSONPosition);
  } else if (geom.type === 'LineString') {
    // eslint-disable-next-line no-param-reassign
    geom.coordinates = geom.coordinates
      .map((coords) => projFunc([coords[0], coords[1]]) as GeoJSONPosition);
  } else if (geom.type === 'MultiLineString') {
    // eslint-disable-next-line no-param-reassign
    geom.coordinates
      .map((line) => line.map(
        (coords) => projFunc([coords[0], coords[1]]) as GeoJSONPosition,
      ));
  } else if (geom.type === 'Polygon') {
    // eslint-disable-next-line no-param-reassign
    geom.coordinates = geom.coordinates
      .map((ring) => ring.map(
        (coords) => projFunc([coords[0], coords[1]]) as GeoJSONPosition,
      ));
  } else if (geom.type === 'MultiPolygon') {
    // eslint-disable-next-line no-param-reassign
    geom.coordinates = geom.coordinates
      .map((poly) => poly.map(
        (ring) => ring.map((coords) => projFunc([coords[0], coords[1]]) as GeoJSONPosition),
      ));
  } else if (geom.type === 'GeometryCollection') {
    // eslint-disable-next-line no-param-reassign
    geom.geometries = geom.geometries
      .map((g) => reprojGeom(g as GeoJSONGeometryType, projFunc));
  }
};

export const reprojWithD3 = (
  proj: GeoProjection,
  data: GeoJSONFeatureCollection,
  invert: boolean = false,
): GeoJSONFeatureCollection => {
  const newData = JSON.parse(JSON.stringify(data));
  const projFunc = invert
    ? (coord) => proj.invert(coord)
    : (coord) => proj(coord);
  newData.features.forEach((f: GeoJSONFeature) => {
    reprojGeom(f.geometry, projFunc);
  });
  return newData;
};

export const reprojWithProj4 = (
  proj: InterfaceProjection,
  data: GeoJSONFeatureCollection,
  invert: boolean = false,
): GeoJSONFeatureCollection => {
  const newData = JSON.parse(JSON.stringify(data));
  const projFunc = invert
    ? (coord) => proj.inverse(coord)
    : (coord) => proj.forward(coord);
  newData.features.forEach((f: GeoJSONFeature) => {
    reprojGeom(f.geometry, projFunc);
  });
  return newData;
};
