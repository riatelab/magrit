// Imports from other packages
import initGoCart from 'go-cart-wasm';
import cartWasmUrl from 'go-cart-wasm/dist/cart.wasm?url';
import { area, transformScale } from '@turf/turf';

// Helpers
import { isNumber } from './common';
import d3 from './d3-custom';
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
import type { GeoJSONFeatureCollection } from '../global';

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

export function noop() {}
