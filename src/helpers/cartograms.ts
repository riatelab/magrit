// Imports from other packages
import initGoCart from 'go-cart-wasm';
import cartWasmUrl from 'go-cart-wasm/dist/cart.wasm?url';
import { area, centroid, transformScale } from '@turf/turf';

// Helpers
import { isFiniteNumber } from './common';
import d3 from './d3-custom';
import { planarArea } from './geo';
import { Mmax, Mmin, Msqrt } from './math';
import {
  getProjection,
  getProjectionUnit,
  reprojWithD3,
  reprojWithProj4,
} from './projection';
import rewindLayer from './rewind';

// Stores
import { mapStore } from '../store/MapStore';

// Types
import type {
  GeoJSONFeature,
  GeoJSONFeatureCollection,
  GeoJSONGeometry,
} from '../global';

let goCart: {
  makeCartogram: (
    data: GeoJSONFeatureCollection,
    variableName: string,
  ) => GeoJSONFeatureCollection,
};

async function getGoCart() {
  if (!goCart) {
    goCart = await initGoCart({
      locateFile: () => cartWasmUrl,
    });
  }

  return goCart;
}

export async function computeCartogramGastnerSeguyMore(
  data: GeoJSONFeatureCollection,
  variableName: string,
): Promise<GeoJSONFeatureCollection> {
  let proj;
  let isGeo;
  let reprojFunc;
  if (mapStore.projection.type === 'd3') {
    isGeo = true;
    proj = d3[mapStore.projection.value]()
      .center([0, 0])
      .translate([0, 0])
      .scale(1);
    reprojFunc = reprojWithD3;
  } else { // mapStore.projection.type === 'proj4'
    const t = getProjectionUnit(mapStore.projection);
    isGeo = t.isGeo;
    proj = getProjection(mapStore.projection.value);
    reprojFunc = reprojWithProj4;
  }

  // If data is geo we keep it in WGS84, otherwise we reproject it to the current map projection
  const projectedData = isGeo ? data : reprojFunc(proj, data);

  const goCartInstance = await getGoCart();

  const resultProj = goCartInstance.makeCartogram(projectedData, variableName);

  return rewindLayer(
    isGeo
      ? resultProj
      : reprojFunc(proj, resultProj, true),
  );
}

export function computeCartogramOlson(
  data: GeoJSONFeatureCollection,
  variableName: string,
): GeoJSONFeatureCollection {
  const nFt = data.features.length;
  const dVal = Array(nFt);
  for (let i = 0; i < nFt; i += 1) {
    const t = data.features[i].properties[variableName];
    dVal[i] = {
      id: i,
      // If the value is not a number, we deliberately set it to 0.
      value: isFiniteNumber(t) ? t : 0,
      area: area(data.features[i] as never),
    };
  }

  // Sort the features by value, from largest to smallest.
  dVal.sort((a, b) => b.value - a.value);

  // Compute the scale factor,
  // based on the area of the feature with the largest value.
  const refScale = dVal[0].value / dVal[0].area;
  dVal[0].scale = 1;

  for (let i = 1; i < dVal.length; i += 1) {
    dVal[i].scale = Math.sqrt(dVal[i].value / dVal[i].area / refScale);
  }

  // Sort again, by feature ID.
  dVal.sort((a, b) => a.id - b.id);

  // Create the output.
  const features = Array(nFt);

  for (let i = 0; i < nFt; i += 1) {
    const ft = data.features[i];
    const s = dVal[i].scale;
    features[i] = transformScale(ft as never, s);
    features[i].properties = { ...ft.properties, scale: s };
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

interface DougInfo {
  averageError: number,
  forceReductionFactor: number,
  infoByFeature: InfoFeature[],
}

interface InfoFeature {
  id: number,
  centerX: number,
  centerY: number,
  value: number,
  area: number,
  mass: number,
  radius: number,
  sizeError: number,
}

/**
 * Gets the information required for computing transformation of each feature
 * for the Dougenik et al. (1985) algorithm.
 *
 * @param data
 * @param variableName
 * @param areaFn
 * @param centroidFn
 */
const getDougenikInfo = (
  data: GeoJSONFeatureCollection,
  variableName: string,
  areaFn: (geom: GeoJSONFeature) => number,
  centroidFn: (geom: GeoJSONFeature) => [number, number],
): DougInfo => {
  const areas = data.features.map((f) => areaFn(f as never));
  const values = data.features.map((f) => +f.properties[variableName]);
  const areaTotal = areas.reduce((a, b) => a + b, 0);
  const valueTotal = values.reduce((a, b) => a + b, 0);
  const fraction = areaTotal / valueTotal;
  const infoByFeature = new Array(data.features.length);
  let totalSizeError = 0;

  data.features.forEach((f, i) => {
    const centroidPt = centroidFn(f as never);
    const value = values[i];
    const areaFeature = areas[i];
    const desired = value * fraction;
    const radius = Msqrt(areaFeature / Math.PI);

    const mass = desired / Math.PI > 0
      ? Msqrt(desired / Math.PI) - radius
      : 0;

    const sizeError = Mmax(areaFeature, desired) / Mmin(areaFeature, desired);
    totalSizeError += sizeError;

    infoByFeature[i] = {
      id: i,
      value,
      area: areaFeature,
      mass,
      radius,
      centerX: centroidPt[0],
      centerY: centroidPt[1],
      sizeError,
    } as InfoFeature;
  });

  const averageError = totalSizeError / data.features.length;
  const forceReductionFactor = 1 / (1 + averageError);
  return {
    averageError,
    forceReductionFactor,
    infoByFeature,
  };
};

/**
 * Transforms a feature using the Dougenik et al. (1985) algorithm.
 *
 * @param geom
 * @param info
 * @param reductionFactor
 * @param allInfo
 */
const transformFeatureDougenik = (
  geom: GeoJSONGeometry,
  info: InfoFeature,
  reductionFactor: number,
  allInfo: InfoFeature[],
) => {
  const geoms: [number, number][][][] = geom.type === 'MultiPolygon'
    ? geom.coordinates
    : [geom.coordinates];
  const initialGeometryType = geom.type;
  const nGeom = geoms.length;
  const result = new Array(nGeom);

  for (let i = 0; i < nGeom; i += 1) {
    const poly = geoms[i];
    const rings = poly.length;
    result[i] = new Array(rings);
    for (let j = 0; j < rings; j += 1) {
      const ring = poly[j];
      const nPts = ring.length;
      const newRing = new Array(nPts);

      for (let k = 0; k < nPts; k += 1) {
        let [x, y] = ring[k];
        const x0 = x;
        const y0 = y;

        for (let ix = 0; ix < allInfo.length; ix += 1) {
          const infoOther = allInfo[ix];
          const cx = infoOther.centerX;
          const cy = infoOther.centerY;
          const distance = Math.sqrt((x0 - cx) ** 2 + (y0 - cy) ** 2);
          let fij = (distance > infoOther.radius)
            ? infoOther.mass * (infoOther.radius / distance)
            : infoOther.mass * (
              (distance / infoOther.radius) ** 2) * (4 - (3 * (distance / infoOther.radius)));

          fij = (fij * reductionFactor) / distance;

          x = (x0 - cx) * fij + x;
          y = (y0 - cy) * fij + y;
        }
        newRing[k] = [x, y];
      }

      result[i][j] = newRing;
    }
  }

  if (initialGeometryType === 'MultiPolygon') {
    return {
      type: 'MultiPolygon',
      coordinates: result,
    };
  } else { // eslint-disable-line no-else-return
    return {
      type: 'Polygon',
      coordinates: result[0],
    };
  }
};

function makeDougenikCartogram(
  data: GeoJSONFeatureCollection,
  variableName: string,
  iterations: number,
  areaFn: (geom: GeoJSONFeature) => number,
  centroidFn: (geom: GeoJSONFeature) => [number, number],
): GeoJSONFeatureCollection {
  const resultData = JSON.parse(JSON.stringify(data)) as GeoJSONFeatureCollection;
  for (let i = 0; i < iterations; i += 1) {
    const dougInfo = getDougenikInfo(
      resultData,
      variableName,
      areaFn,
      centroidFn,
    );
    for (let j = 0; j < resultData.features.length; j += 1) {
      const feature = resultData.features[j];
      const info = dougInfo.infoByFeature[j];
      const transformed = transformFeatureDougenik(
        feature.geometry as never,
        info,
        dougInfo.forceReductionFactor,
        dougInfo.infoByFeature,
      );
      resultData.features[j].geometry = transformed as never;
    }
  }

  // Compute the information for the final cartogram
  // and retrieve the size error for each feature
  const areas = resultData.features.map((f) => areaFn(f as never));
  const values = resultData.features.map((f) => +f.properties[variableName]);
  const areaTotal = areas.reduce((a, b) => a + b, 0);
  const valueTotal = values.reduce((a, b) => a + b, 0);

  resultData.features.forEach((f, i) => {
    // eslint-disable-next-line no-param-reassign
    f.properties.area_error = areas[i] / areaTotal / (values[i] / valueTotal);
  });

  return resultData;
}

/**
 * Compute a cartogram using the Dougenik et al. (1985) algorithm.
 * Note that this is a translation of https://github.com/riatelab/magrit/blob/master/magrit_app/helpers/cartogram_doug.pyx.
 *
 * @param data
 * @param variableName
 * @param iterations
 * @return {GeoJSONFeatureCollection}
 */
export function computeCartogramDougenik(
  data: GeoJSONFeatureCollection,
  variableName: string,
  iterations: number,
): GeoJSONFeatureCollection {
  let proj;
  // let isGeo;
  let reprojFunc;
  if (mapStore.projection.type === 'd3') {
    // isGeo = true;
    proj = d3[mapStore.projection.value]()
      .center([0, 0])
      .translate([0, 0])
      .scale(1);
    reprojFunc = reprojWithD3;
  } else { // mapStore.projection.type === 'proj4'
    const t = getProjectionUnit(mapStore.projection);
    // isGeo = t.isGeo;
    proj = getProjection(mapStore.projection.value);
    reprojFunc = reprojWithProj4;
  }

  // We project the data it to the current map projection
  // before computing the cartogram
  const projectedData = reprojFunc(proj, data);

  // Compute cartogram
  const resultDataProjected = makeDougenikCartogram(
    projectedData,
    variableName,
    iterations,
    planarArea,
    (f) => centroid(f as never).geometry.coordinates as [number, number],
  );

  // Unproject the data back to WGS84
  const resultData = reprojFunc(proj, resultDataProjected, true);

  return resultData;
}
