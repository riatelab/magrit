// Imports from other packages
import initGoCart from 'go-cart-wasm';
import cartWasmUrl from 'go-cart-wasm/dist/cart.wasm?url';
import { area, transformScale } from '@turf/turf';

// Helpers
import { isNumber } from './common';
import d3 from './d3-custom';
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
      value: isNumber(t) ? t : 0,
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
 */
const getDougenikInfo = (
  data: GeoJSONFeatureCollection,
  variableName: string,
): DougInfo => {
  const areas = data.features.map((f) => area(f.geometry as never));
  const values = data.features.map((f) => +f.properties[variableName]);
  console.log(areas, values);
  const areaTotal = areas.reduce((a, b) => a + b, 0);
  const valueTotal = values.reduce((a, b) => a + b, 0);
  const fraction = areaTotal / valueTotal;
  const infoByFeature = new Array(data.features.length);
  let totalSizeError = 0;

  data.features.forEach((f, i) => {
    const centroid = d3.geoCentroid(f.geometry as never);
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
      centerX: centroid[0],
      centerY: centroid[1],
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

    for (let j = 0; j < rings; j += 1) {
      const ring = poly[j];
      const nPts = ring.length;
      const newRing = new Array(nPts);

      for (let k = 0; k < nPts; k += 1) {
        let x = ring[k][0];
        let y = ring[k][1];
        const x0 = x;
        const y0 = y;

        for (let ix = 0; ix < allInfo.length; ix += 1) {
          const infoOther = allInfo[ix];
          const cx = x - infoOther.centerX;
          const cy = y - infoOther.centerY;
          const r2 = cx * cx + cy * cy;
          const distance = Msqrt(r2);
          let fij = (distance > infoOther.radius)
            ? (infoOther.mass * infoOther.radius) / distance
            : (infoOther.mass * (distance / infoOther.radius ** 2)
            ) * (4 - ((3 * distance) / infoOther.radius));

          fij = (fij * reductionFactor) / distance;

          x = (x0 - cx) * fij + x;
          y = (y0 - cy) * fij + y;
        }
        newRing[k] = [x, y];
      }

      result[j] = newRing;
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
  const resultData = JSON.parse(JSON.stringify(data)) as GeoJSONFeatureCollection;
  for (let i = 0; i < iterations; i += 1) {
    const dougInfo = getDougenikInfo(resultData, variableName);
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
  return resultData;
}
