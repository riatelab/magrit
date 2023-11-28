// Imports from external packages
import { GPU } from 'gpu.js';
import { pointGrid } from '@turf/turf';
import type { BBox } from '@turf/turf';

// Helpers
import { makeCentroidLayer } from './geo';

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
  return pointGrid(bb as BBox, gridParameters.resolution) as GeoJSONFeatureCollection;
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

function computeStewartInner(
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

function computeKdeInner(
  xCell: number[],
  yCell: number[],
  xDot: number[],
  yDot: number[],
  values: number[],
): number {
  let value = 0;
  let vs = 0;
  for (let i = 0; i < this.constants.size; i++) { // eslint-disable-line no-plusplus
    const dist = this.haversineDistance(
      xDot[i],
      yDot[i],
      xCell[this.thread.x],
      yCell[this.thread.x],
    );
    // eslint-disable-next-line prefer-exponentiation-operator, no-restricted-properties
    const k = this.k(dist);
    const v = this.constants.normalizer * values[i];
    value += k * v;
    vs += v;
  }
  return value / vs;
}

export function computeStewart(
  data: GeoJSONFeatureCollection,
  inputType: 'point' | 'polygon',
  variableName: string,
  gridParameters: GridParameters,
  stewartParameters: StewartParameters,
): GeoJSONFeatureCollection {
  // Make a suitable grid of points
  const grid = makePointGrid(gridParameters, false);

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

  // Create the GPU instance and define the kernel
  const gpu = new GPU();
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
    cell.properties.pot = pots[i]; // eslint-disable-line no-param-reassign
  });

  // TODO: we want to return the contours built from the grid (possibly clipped by the reference layer),
  //  not the grid
  return grid;
}

const computeNormalizer = (values: number[]): number => {
  let sum = 0;
  for (let i = 0; i < values.length; i += 1) {
    sum += values[i];
  }
  return 1 / sum;
};

export function computeKde(
  data: GeoJSONFeatureCollection,
  inputType: 'point' | 'polygon',
  variableName: string,
  gridParameters: GridParameters,
  kdeParameters: KdeParameters,
): GeoJSONFeatureCollection {
  // Make a suitable grid of points
  const grid = makePointGrid(gridParameters, false);

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
      .addFunction(
        function k(dist: number): number { // eslint-disable-line prefer-arrow-callback
          // eslint-disable-next-line prefer-exponentiation-operator, no-restricted-properties
          return Math.exp(-0.5 * Math.pow(dist, 2));
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
        function k(dist: number): number { // eslint-disable-line prefer-arrow-callback
          // eslint-disable-next-line prefer-exponentiation-operator, no-restricted-properties
          return 0.75 * (1 - Math.pow(dist, 2));
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
        function k(dist: number): number { // eslint-disable-line prefer-arrow-callback
          return 1 - Math.abs(dist);
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
        function k(dist: number): number { // eslint-disable-line prefer-arrow-callback
          return 0.5;
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

  const values = kernel(xCells, yCells, xDots, yDots, values) as Float32Array;

  grid.features.forEach((cell, i) => {
    cell.properties.z = values[i]; // eslint-disable-line no-param-reassign
  });

  // TODO: we want to return the contours built from the grid (possibly clipped by the reference layer),
  //  not the grid
  return grid;
}
