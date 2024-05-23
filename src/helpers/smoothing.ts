// Imports from external packages
import { GPU } from 'gpu.js';
import { pointGrid } from '@turf/turf';
import type { isobands } from 'contour-wasm';

// Stores
import { setLoadingMessage } from '../store/GlobalStore';

// Helpers
import { makeCentroidLayer } from './geo';
import { isFiniteNumber } from './common';
import { convertToTopojsonQuantizeAndBackToGeojson } from './topojson';

// Types
import type {
  GeoJSONFeature,
  GeoJSONFeatureCollection,
  GridParameters,
  KdeParameters,
  StewartParameters,
} from '../global';

let contourModule: { isobands: typeof isobands } | null = null;

async function getContourWasm() {
  if (!contourModule) {
    contourModule = await import('contour-wasm');
  }
  return contourModule;
}

function isLargerThanHemisphere(
  xMin: number,
  yMin: number,
  xMax: number,
  yMax: number,
): boolean {
  return (xMax - xMin) > 180 || (yMax - yMin) > 90;
}

function kmToDeg(km: number): number {
  return km / 111;
}

function customPointGrid(
  bbox: [number, number, number, number],
  resolution: number,
): GeoJSONFeatureCollection {
  const [xMin, yMin, xMax, yMax] = bbox;
  // Turf isn't able to make grid larger than a hemisphere
  // so we handle this case manually (matching the output of turf's pointGrid function)
  if (isLargerThanHemisphere(xMin, yMin, xMax, yMax)) {
    const res = kmToDeg(resolution);
    const features = [];
    for (let x = xMin; x < xMax; x += res) {
      for (let y = yMin; y < yMax; y += res) {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [x, y],
          },
          properties: {},
        });
      }
    }
    return {
      type: 'FeatureCollection',
      features,
    } as GeoJSONFeatureCollection;
  }
  return pointGrid(
    bbox,
    resolution,
  ) as GeoJSONFeatureCollection;
}

function makePointGrid(
  gridParameters: GridParameters,
  useOffset: boolean,
): GeoJSONFeatureCollection {
  const bb: [number, number, number, number] = [
    gridParameters.xMin,
    gridParameters.yMin,
    gridParameters.xMax,
    gridParameters.yMax,
  ];
  if (useOffset) {
    const [minX, minY, maxX, maxY] = bb;
    const offsetX = (maxX - minX) / 10;
    const offsetY = (maxY - minY) / 10;
    bb[0] -= offsetX;
    bb[2] += offsetX;
    bb[1] -= offsetY;
    bb[3] += offsetY;
  }
  // We dont want points to be outside the sphere
  // (lon between -180 and 180, lat between -90 and 90)
  if (bb[0] < -180) {
    bb[0] = -180;
  }
  if (bb[2] > 180) {
    bb[2] = 180;
  }
  if (bb[1] < -90) {
    bb[1] = -90;
  }
  if (bb[3] > 90) {
    bb[3] = 90;
  }
  return customPointGrid(bb, gridParameters.resolution) as GeoJSONFeatureCollection;
}

const computeStep = (
  xCoords: Set<number>,
  yCoords: Set<number>,
): {
  xStep: number,
  yStep: number,
} => {
  // const xStep = (max(...xCoords) - min(...xCoords)) / (xCoords.size - 1);
  // const yStep = (max(...yCoords) - min(...yCoords)) / (yCoords.size - 1);
  const itX = xCoords.values();
  const itY = yCoords.values();
  const x0 = itX.next().value;
  const x1 = itX.next().value;
  const y0 = itY.next().value;
  const y1 = itY.next().value;
  return {
    xStep: x1 - x0,
    yStep: y1 - y0,
  };
};

export async function makeContourLayer(
  grid: GeoJSONFeatureCollection,
  thresholds: number[],
  variableName: string,
): Promise<GeoJSONFeatureCollection> {
  console.time('gridPreparationForContours');
  const xCoords = new Set(grid.features.map((d) => d.geometry.coordinates[0]));
  const yCoords = new Set(grid.features.map((d) => d.geometry.coordinates[1]));
  const { xStep, yStep } = computeStep(xCoords, yCoords);
  const width = xCoords.size;
  const height = yCoords.size;

  // We need to change the order of the values
  // TODO: maybe this should be an upstream improvement in contour-wasm,
  //   supporting a different order of the values (and/or having
  //   utility function to take a GeoJSON grid of points as input).
  const v = [];
  for (let i = 0; i < height; i += 1) {
    for (let j = 0; j < width; j += 1) {
      v.push(grid.features[j * height + i].properties.z as number);
    }
  }
  console.timeEnd('gridPreparationForContours');
  const values = new Float64Array(v);
  const options = {
    x_origin: Math.min(...xCoords),
    y_origin: Math.min(...yCoords),
    x_step: xStep,
    y_step: yStep,
  };

  const intervals = new Float64Array(thresholds);

  const contours = (await getContourWasm()).isobands(
    values,
    width,
    height,
    intervals,
    options,
  );

  contours.features.forEach((ft: GeoJSONFeature) => {
    // eslint-disable-next-line no-param-reassign
    ft.properties.center_v = (ft.properties.min_v + ft.properties.max_v) / 2;
    // eslint-disable-next-line no-param-reassign
    ft.properties[variableName] = ft.properties.center_v;
  });

  // Convert the contour layer to TopoJSON, apply the quantization and convert back to GeoJSON
  return convertToTopojsonQuantizeAndBackToGeojson(contours) as GeoJSONFeatureCollection;
}

function haversineDistance(lon1: number, lat1: number, lon2: number, lat2: number): number {
  // eslint-disable-next-line no-param-reassign
  lat1 *= this.constants.deg2rad;
  // eslint-disable-next-line no-param-reassign
  lon1 *= this.constants.deg2rad;
  // eslint-disable-next-line no-param-reassign
  lat2 *= this.constants.deg2rad;
  // eslint-disable-next-line no-param-reassign
  lon2 *= this.constants.deg2rad;

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(lat1) * Math.cos(lat2)
    * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return this.constants.R * c;
}

function computeStewartInnerExponential(
  xCell: number[],
  yCell: number[],
  xDot: number[],
  yDot: number[],
  values: number[],
): number {
  let sum = 0;
  for (let i = 0; i < this.constants.size; i++) { // eslint-disable-line no-plusplus
    const dist = this.haversineDistance(
      xDot[i],
      yDot[i],
      xCell[this.thread.x],
      yCell[this.thread.x],
    );
    // eslint-disable-next-line prefer-exponentiation-operator, no-restricted-properties
    sum += (values[i] * Math.exp(-this.constants.alpha * Math.pow(dist, this.constants.beta)));
  }
  return sum;
}

function computeStewartInnerPareto(
  xCell: number[],
  yCell: number[],
  xDot: number[],
  yDot: number[],
  values: number[],
): number {
  let sum = 0;
  for (let i = 0; i < this.constants.size; i++) { // eslint-disable-line no-plusplus
    const dist = this.haversineDistance(
      xDot[i],
      yDot[i],
      xCell[this.thread.x],
      yCell[this.thread.x],
    );
    // eslint-disable-next-line prefer-exponentiation-operator, no-restricted-properties
    sum += (values[i] * Math.pow(1 + this.constants.alpha * dist, -this.constants.beta));
  }
  return sum;
}

function computeKdeInner(
  xCell: number[],
  yCell: number[],
  xDot: number[],
  yDot: number[],
  values: number[],
): number {
  let value = 0;
  // let vs = 0;
  for (let i = 0; i < this.constants.size; i++) { // eslint-disable-line no-plusplus
    const dist = this.haversineDistance(
      xDot[i],
      yDot[i],
      xCell[this.thread.x],
      yCell[this.thread.x],
    );
    const kv = this.computeKde(dist, this.constants.bandwidth);
    value += kv * values[i];
  }
  return value;
}

const prepareArrays = (
  grid: GeoJSONFeatureCollection,
  inputLayer: GeoJSONFeatureCollection,
  variableName: string,
): {
  xCells: number[],
  yCells: number[],
  xDots: number[],
  yDots: number[],
  values: number[],
} => {
  // We know the length of these arrays
  const xCells: number[] = new Array(grid.features.length);
  const yCells: number[] = new Array(grid.features.length);

  // There might be non-number or null values in the input layer
  // so we will need to filter them out
  const xDots: number[] = [];
  const yDots: number[] = [];
  const values: number[] = [];

  for (let i = 0; i < grid.features.length; i++) { // eslint-disable-line no-plusplus
    // eslint-disable-next-line prefer-destructuring
    xCells[i] = grid.features[i].geometry.coordinates[0];
    // eslint-disable-next-line prefer-destructuring
    yCells[i] = grid.features[i].geometry.coordinates[1];
  }

  for (let i = 0; i < inputLayer.features.length; i++) { // eslint-disable-line no-plusplus
    const v = inputLayer.features[i].properties[variableName] as any;
    if (isFiniteNumber(v)) {
      // eslint-disable-next-line prefer-destructuring
      xDots.push(inputLayer.features[i].geometry.coordinates[0]);
      // eslint-disable-next-line prefer-destructuring
      yDots.push(inputLayer.features[i].geometry.coordinates[1]);
      values.push(+v as number);
    }
  }

  return {
    xCells,
    yCells,
    xDots,
    yDots,
    values,
  };
};

export async function computeStewartValues(
  data: GeoJSONFeatureCollection,
  inputType: 'point' | 'polygon',
  variableName: string,
  gridParameters: GridParameters,
  stewartParameters: StewartParameters,
): Promise<[GeoJSONFeatureCollection, number[]]> {
  // Make a suitable grid of points
  const grid = makePointGrid(gridParameters, true);

  // Compute the inputs points from
  const inputLayer = makeCentroidLayer(data, inputType, [variableName]);

  // Appropriate function to compute the potential
  const computeStewartInner = stewartParameters.function === 'Gaussian'
    ? computeStewartInnerExponential
    : computeStewartInnerPareto;

  // Values ready to be used in the GPU kernel
  const {
    xCells, yCells,
    xDots, yDots,
    values,
  } = prepareArrays(grid, inputLayer, variableName);

  // Create the GPU instance and define the kernel
  const gpu = new GPU({ mode: 'webgl2' });
  const kernel = gpu
    .addFunction(
      haversineDistance,
      {
        argumentTypes: {
          lon1: 'Number',
          lat1: 'Number',
          lon2: 'Number',
          lat2: 'Number',
        },
        returnType: 'Number',
      },
    )
    .createKernel(
      computeStewartInner,
      {
        constants: {
          alpha: stewartParameters.alpha,
          beta: stewartParameters.beta,
          deg2rad: Math.PI / 180,
          R: 6371,
          size: inputLayer.features.length,
        },
        output: [grid.features.length],
      },
    );

  // Actually compute the potential values
  const pots = kernel(xCells, yCells, xDots, yDots, values) as Float32Array;

  // Add the potential values to the grid
  grid.features.forEach((cell, i) => {
    cell.properties.z = pots[i]; // eslint-disable-line no-param-reassign
  });

  return [grid, Array.from(pots)];
}

const computeNormalizer = (values: number[]): number => {
  let sum = 0;
  for (let i = 0; i < values.length; i += 1) {
    sum += values[i];
  }
  return 1 / sum;
};

export async function computeKdeValues(
  data: GeoJSONFeatureCollection,
  inputType: 'point' | 'polygon',
  variableName: string,
  gridParameters: GridParameters,
  kdeParameters: KdeParameters,
): Promise<[GeoJSONFeatureCollection, number[]]> {
  await setLoadingMessage('SmoothingDataPreparation');
  // Make a suitable grid of points
  const grid = makePointGrid(gridParameters, true);

  // Compute the inputs points from
  const inputLayer = makeCentroidLayer(data, inputType, [variableName]);

  // Values ready to be used in the GPU kernel
  const {
    xCells, yCells,
    xDots, yDots,
    values,
  } = prepareArrays(grid, inputLayer, variableName);

  // We will use this value to normalize input values
  const normalizer = computeNormalizer(values);

  // Create the GPU instance and define the kernel
  const gpu = new GPU();
  gpu
    .addFunction(
      haversineDistance,
      {
        argumentTypes: {
          lon1: 'Number',
          lat1: 'Number',
          lon2: 'Number',
          lat2: 'Number',
        },
        returnType: 'Number',
      },
    );

  if (kdeParameters.kernel === 'Gaussian') {
    gpu
      .addFunction( // eslint-disable-next-line prefer-arrow-callback
        function computeKde(dist: number, bandwidth: number): number {
          const exponent = -(dist * dist) / (2 * bandwidth * bandwidth);
          return Math.exp(exponent) / (Math.sqrt(2 * Math.PI) * bandwidth);
        },
        {
          argumentTypes: {
            dist: 'Number',
            bandwidth: 'Number',
          },
          returnType: 'Number',
        },
      );
  // } else if (kdeParameters.kernel === 'Epanechnikov') {
  //   gpu
  //     .addFunction(
  //       // eslint-disable-next-line prefer-arrow-callback
  //       function computeKde(dist: number, bandwidth: number): number {
  //         const u = dist / bandwidth;
  //         if (Math.abs(u) <= 1) {
  //           return (3 / 4) * (1 - u * u) / bandwidth; // eslint-disable-line no-mixed-operators
  //         }
  //         return 0;
  //       },
  //       {
  //         argumentTypes: {
  //           dist: 'Number',
  //           bandwidth: 'Number',
  //         },
  //         returnType: 'Number',
  //       },
  //     );
  // } else if (kdeParameters.kernel === 'Quartic') {
  //   gpu
  //     .addFunction( // eslint-disable-next-line prefer-arrow-callback
  //       function computeKde(dist: number, bandwidth: number): number {
  //         const u = dist / bandwidth;
  //         if (Math.abs(u) <= 1) {
  //           const t = (1 - u * u) * (1 - u * u);
  //           // eslint-disable-next-line no-restricted-properties, prefer-exponentiation-operator
  //           return ((15 / 16) * t) / bandwidth;
  //         }
  //         return 0;
  //       },
  //       {
  //         argumentTypes: {
  //           dist: 'Number',
  //           bandwidth: 'Number',
  //         },
  //         returnType: 'Number',
  //       },
  //     );
  } else if (kdeParameters.kernel === 'Triangular') {
    gpu
      .addFunction(
        // eslint-disable-next-line prefer-arrow-callback
        function computeKde(dist: number, bandwidth: number): number {
          const u = dist / bandwidth;
          if (Math.abs(u) <= 1) {
            return (1 - Math.abs(u)) / bandwidth;
          }
          return 0;
        },
        {
          argumentTypes: {
            dist: 'Number',
            bandwidth: 'Number',
          },
          returnType: 'Number',
        },
      );
  // } else if (kdeParameters.kernel === 'Biweight') {
  //   gpu
  //     .addFunction(
  //       // eslint-disable-next-line prefer-arrow-callback
  //       function computeKde(dist: number, bandwidth: number): number {
  //         const u = dist / bandwidth;
  //         if (Math.abs(u) <= 1) {
  //           return (1 - Math.abs(u)) * bandwidth;
  //         }
  //         return 0;
  //       },
  //       {
  //         argumentTypes: {
  //           dist: 'Number',
  //           bandwidth: 'Number',
  //         },
  //         returnType: 'Number',
  //       },
  //     );
  } else { // (kdeParameters.kernel === 'uniform')
    gpu
      .addFunction(
        // eslint-disable-next-line prefer-arrow-callback
        function computeKde(dist: number, bandwidth: number): number {
          const u = dist / bandwidth;
          if (Math.abs(u) <= 1) {
            return 1 / (2 * bandwidth);
          }
          return 0;
        },
        {
          argumentTypes: {
            dist: 'Number',
            bandwidth: 'Number',
          },
          returnType: 'Number',
        },
      );
  }

  const kernel = gpu
    .createKernel(
      computeKdeInner,
      {
        constants: {
          normalizer,
          bandwidth: kdeParameters.bandwidth,
          PI: Math.PI,
          deg2rad: Math.PI / 180,
          R: 6371,
          size: inputLayer.features.length,
        },
        output: [grid.features.length],
      },
    );

  await setLoadingMessage('SmoothingComputingGPUKDE');

  const resultValues = Array.from(kernel(xCells, yCells, xDots, yDots, values) as Float32Array)
    .map((d) => d * gridParameters.resolution);

  grid.features.forEach((cell, i) => {
    cell.properties.z = resultValues[i]; // eslint-disable-line no-param-reassign
  });

  return [grid, resultValues];
}
