// Imports from external packages
import { GPU } from 'gpu.js';
import { pointGrid } from '@turf/turf';
import { isobands } from 'contour-wasm';
import type { BBox } from '@turf/turf';

// Stores
import { setLoadingMessage } from '../store/GlobalStore';

// Helpers
import { makeCentroidLayer } from './geo';
import { intersection } from './geos';
import { max, min } from './math';
import { convertToTopojsonQuantizeAndBackToGeojson } from './topojson';

// Types
import type {
  GeoJSONFeatureCollection,
  GridParameters,
  KdeParameters,
  StewartParameters,
} from '../global';

function makePointGrid(
  gridParameters: GridParameters,
  useOffset: boolean,
): GeoJSONFeatureCollection {
  const bb = [
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
  return pointGrid(bb as BBox, gridParameters.resolution) as GeoJSONFeatureCollection;
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

function makeContourLayer(
  grid: GeoJSONFeatureCollection,
  thresholds: number[],
): GeoJSONFeatureCollection {
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
      v.push(grid.features[j * height + i].properties.z);
    }
  }

  const values = new Float64Array(v);
  const options = {
    x_origin: Math.min(...xCoords),
    y_origin: Math.min(...yCoords),
    x_step: xStep,
    y_step: yStep,
  };

  const intervals = new Float64Array(thresholds);

  const contours = isobands(
    values,
    width,
    height,
    intervals,
    options,
  );

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
    // eslint-disable-next-line prefer-exponentiation-operator, no-restricted-properties
    const kv = this.k(dist, this.constants.bandwidth);
    value += kv * values[i];
  }
  return value;
}

export async function computeStewart(
  data: GeoJSONFeatureCollection,
  inputType: 'point' | 'polygon',
  variableName: string,
  gridParameters: GridParameters,
  stewartParameters: StewartParameters,
): Promise<GeoJSONFeatureCollection> {
  console.group('computeStewart');
  console.time('preparation');
  // Make a suitable grid of points
  const grid = makePointGrid(gridParameters, true);

  // Compute the inputs points from
  const inputLayer = makeCentroidLayer(data, inputType, [variableName]);

  // Appropriate function to compute the potential
  const computeStewartInner = stewartParameters.function === 'gaussian'
    ? computeStewartInnerExponential
    : computeStewartInnerPareto;

  // Extract coordinates values from the grid and the input points
  // in arrays that can be passed to the GPU
  const xCells: number[] = new Array(grid.features.length);
  const yCells: number[] = new Array(grid.features.length);
  const xDots: number[] = new Array(inputLayer.features.length);
  const yDots: number[] = new Array(inputLayer.features.length);
  const values: number[] = new Array(inputLayer.features.length);

  for (let i = 0; i < grid.features.length; i++) { // eslint-disable-line no-plusplus
    // eslint-disable-next-line prefer-destructuring
    xCells[i] = grid.features[i].geometry.coordinates[0];
    // eslint-disable-next-line prefer-destructuring
    yCells[i] = grid.features[i].geometry.coordinates[1];
  }

  for (let i = 0; i < inputLayer.features.length; i++) { // eslint-disable-line no-plusplus
    // eslint-disable-next-line prefer-destructuring
    xDots[i] = inputLayer.features[i].geometry.coordinates[0];
    // eslint-disable-next-line prefer-destructuring
    yDots[i] = inputLayer.features[i].geometry.coordinates[1];
    values[i] = inputLayer.features[i].properties[variableName] as number;
  }

  console.timeEnd('preparation');
  console.time('kernel');

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

  console.timeEnd('kernel');
  console.time('contours');

  // Add the potential values to the grid
  grid.features.forEach((cell, i) => {
    cell.properties.z = pots[i]; // eslint-disable-line no-param-reassign
  });

  const maxPot = max(pots);

  const thresholds = [0, 0.03, 0.06, 0.1, 0.25, 0.4, 0.55, 0.75, 0.85, 0.925, 1]
    .map((d) => d * maxPot);

  const contours = makeContourLayer(grid, thresholds);
  contours.features.forEach((ft) => {
    // eslint-disable-next-line no-param-reassign
    ft.properties.center = (ft.properties.min_v + ft.properties.max_v) / 2;
    // eslint-disable-next-line no-param-reassign
    ft.properties[variableName] = ft.properties.center;
  });

  console.timeEnd('contours');
  console.time('intersection');
  const clippedContours = await intersection(contours, data);
  console.timeEnd('intersection');
  console.groupEnd();
  return clippedContours;
}

const computeNormalizer = (values: number[]): number => {
  let sum = 0;
  for (let i = 0; i < values.length; i += 1) {
    sum += values[i];
  }
  return 1 / sum;
};

export async function computeKde(
  data: GeoJSONFeatureCollection,
  inputType: 'point' | 'polygon',
  variableName: string,
  gridParameters: GridParameters,
  kdeParameters: KdeParameters,
): Promise<GeoJSONFeatureCollection> {
  await setLoadingMessage('SmoothingDataPreparation');
  // Make a suitable grid of points
  const grid = makePointGrid(gridParameters, true);

  // Compute the inputs points from
  const inputLayer = makeCentroidLayer(data, inputType, [variableName]);

  // Extract coordinates values from the grid and the input points
  // in arrays that can be passed to the GPU
  const xCells: number[] = new Array(grid.features.length);
  const yCells: number[] = new Array(grid.features.length);
  const xDots: number[] = new Array(inputLayer.features.length);
  const yDots: number[] = new Array(inputLayer.features.length);
  const values: number[] = new Array(inputLayer.features.length);

  for (let i = 0; i < grid.features.length; i++) { // eslint-disable-line no-plusplus
    // eslint-disable-next-line prefer-destructuring
    xCells[i] = grid.features[i].geometry.coordinates[0];
    // eslint-disable-next-line prefer-destructuring
    yCells[i] = grid.features[i].geometry.coordinates[1];
  }

  for (let i = 0; i < inputLayer.features.length; i++) { // eslint-disable-line no-plusplus
    // eslint-disable-next-line prefer-destructuring
    xDots[i] = inputLayer.features[i].geometry.coordinates[0];
    // eslint-disable-next-line prefer-destructuring
    yDots[i] = inputLayer.features[i].geometry.coordinates[1];
    values[i] = inputLayer.features[i].properties[variableName];
  }

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

  if (kdeParameters.kernel === 'gaussian') {
    gpu
      .addFunction( // eslint-disable-next-line prefer-arrow-callback
        function k(dist: number, bandwidth: number): number {
          const exponent = -(dist * dist) / (2 * bandwidth * bandwidth);
          return Math.exp(exponent) / (Math.sqrt(2 * Math.PI) * bandwidth);
        },
        {
          argumentTypes: {
            dist: 'Number',
          },
          returnType: 'Number',
        },
      );
  } else if (kdeParameters.kernel === 'epanechnikov') {
    gpu
      .addFunction(
        // eslint-disable-next-line prefer-arrow-callback
        function k(dist: number, bandwidth: number): number {
          const u = dist / bandwidth;
          if (Math.abs(u) <= 1) {
            return (3 / 4) * (1 - u * u) / bandwidth; // eslint-disable-line no-mixed-operators
          }
          return 0;
        },
        {
          argumentTypes: {
            dist: 'Number',
          },
          returnType: 'Number',
        },
      );
  } else if (kdeParameters.kernel === 'quartic') {
    gpu
      .addFunction( // eslint-disable-next-line prefer-arrow-callback
        function k(dist: number, bandwidth: number): number {
          const u = dist / bandwidth;
          if (Math.abs(u) <= 1) {
            const t = (1 - u * u) * (1 - u * u);
            // eslint-disable-next-line no-restricted-properties, prefer-exponentiation-operator
            return ((15 / 16) * t) / bandwidth;
          }
          return 0;
        },
        {
          argumentTypes: {
            dist: 'Number',
          },
          returnType: 'Number',
        },
      );
  } else if (kdeParameters.kernel === 'triangular') {
    gpu
      .addFunction(
        // eslint-disable-next-line prefer-arrow-callback
        function k(dist: number, bandwidth: number): number {
          const u = dist / bandwidth;
          if (Math.abs(u) <= 1) {
            return (1 - Math.abs(u)) / bandwidth;
          }
          return 0;
        },
        {
          argumentTypes: {
            dist: 'Number',
          },
          returnType: 'Number',
        },
      );
  } else if (kdeParameters.kernel === 'biweight') {
    gpu
      .addFunction(
        // eslint-disable-next-line prefer-arrow-callback
        function k(dist: number, bandwidth: number): number {
          const u = dist / bandwidth;
          if (Math.abs(u) <= 1) {
            return (1 - Math.abs(u)) * bandwidth;
          }
          return 0;
        },
        {
          argumentTypes: {
            dist: 'Number',
          },
          returnType: 'Number',
        },
      );
  } else { // (kdeParameters.kernel === 'uniform')
    gpu
      .addFunction(
        // eslint-disable-next-line prefer-arrow-callback
        function k(dist: number, bandwidth: number): number {
          const u = dist / bandwidth;
          if (Math.abs(u) <= 1) {
            return 1 / (2 * bandwidth);
          }
          return 0;
        },
        {
          argumentTypes: {
            dist: 'Number',
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

  const resultValues = kernel(xCells, yCells, xDots, yDots, values) as Float32Array;

  await setLoadingMessage('SmoothingContours');

  grid.features.forEach((cell, i) => {
    cell.properties.z = resultValues[i]; // eslint-disable-line no-param-reassign
  });

  const maxPot = max(resultValues);

  const thresholds = [0, 0.03, 0.06, 0.1, 0.25, 0.4, 0.55, 0.75, 0.85, 0.925, 1]
    .map((d) => d * maxPot);

  const contours = makeContourLayer(grid, thresholds);

  contours.features.forEach((ft) => {
    // eslint-disable-next-line no-param-reassign
    ft.properties.center = (ft.properties.min_v + ft.properties.max_v) / 2;
    // eslint-disable-next-line no-param-reassign
    ft.properties[variableName] = ft.properties.center;
  });

  await setLoadingMessage('SmoothingIntersection');
  return intersection(contours, data);
}
