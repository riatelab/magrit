import d3 from './d3-custom';
import { ascending } from './common';

export const Mmax = Math.max;
export const Mmin = Math.min;
export const Mabs = Math.abs;
export const Mpow = Math.pow; // eslint-disable-line no-restricted-properties
export const Msqrt = Math.sqrt;
export const Mround = Math.round;
export const Mceil = Math.ceil;
export const Mfloor = Math.floor;
export const Mlog = Math.log;
export const Mlog10 = Math.log10;
export const Mexp = Math.exp;
export const Msin = Math.sin;
export const Mcos = Math.cos;
export const Matan = Math.atan;
export const Matan2 = Math.atan2;
export const Mtan = Math.tan;
export const Macos = Math.acos;

type UnsignedNumberArray = Uint8Array
| Uint16Array
| Uint32Array;

type SignedNumberArray = Int8Array
| Int16Array
| Int32Array;

type FloatNumberArray = Float32Array
| Float64Array;

type NumberArray = UnsignedNumberArray
| SignedNumberArray
| FloatNumberArray
| number[];

export const degToRadConstant = Math.PI / 180;
export const radToDegConstant = 180 / Math.PI;
export const SQRT3 = Msqrt(3);

/**
 * Rounds a number to a specified number of decimal places.
 * @param {number} num
 * @param {number} [decimalPlaces=2]
 * @returns {number}
 */
export function round(num: number, decimalPlaces: number | null): number {
  if (decimalPlaces === null) return num;
  const exponent = decimalPlaces || 0;
  const p = 10 ** exponent;
  return Math.round((num * p) * (1 + Number.EPSILON)) / p;
}

/**
 * Returns the minimum value of an array of numbers.
 * @param {number[]} arr
 * @returns {number}
 */
export function min(arr: NumberArray): number { // TODO: rename as minUnchecked ?
  let minVal = Infinity;
  for (let i = 0, l = arr.length; i < l; i += 1) {
    if (arr[i] < minVal) {
      minVal = arr[i];
    }
  }
  return minVal;
}

/**
 * Round a value to the nearest multiple of a given number.
 */
export function roundToMultiple(value: number, multiple: number): number {
  return Mround(value / multiple) * multiple;
}

export const roundToNearest5 = (value: number): number => roundToMultiple(value, 5);
export const roundToNearest10 = (value: number): number => roundToMultiple(value, 10);

/**
 * Returns the maximum value of an array of numbers.
 * @param {number[]} arr
 * @returns {number}
 */
export function max(arr: NumberArray): number { // TODO: rename as maxUnchecked ?
  let maxVal = -Infinity;
  for (let i = 0, l = arr.length; i < l; i += 1) {
    if (arr[i] > maxVal) {
      maxVal = arr[i];
    }
  }
  return maxVal;
}

/**
 * Returns the minimum and maximum values of an array of numbers.
 *
 * @param {number[]} arr - An array of numbers.
 * @returns {[number, number]} - The minimum and maximum values of the array.
 */
export function extent(arr: NumberArray): [number, number] { // TODO: rename as extentUnchecked ?
  let minVal = arr[0];
  let maxVal = arr[0];
  for (let i = 1, l = arr.length; i < l; i += 1) {
    if (arr[i] < minVal) {
      minVal = arr[i];
    } else if (arr[i] > maxVal) {
      maxVal = arr[i];
    }
  }
  return [minVal, maxVal];
}

/**
 * Returns the sum of an array of numbers.
 *
 * @param {number[]} arr - An array of numbers.
 * @return - The sum of the array.
 */
export function sum(arr: NumberArray): number {
  let sumVal = arr[0];
  for (let i = 1, l = arr.length; i < l; i += 1) {
    sumVal += arr[i];
  }
  return sumVal;
}

/**
 * Returns the mean of an array of numbers.
 * @param {number[]} arr - An array of numbers.
 * @return {number} - The mean of the array.
 */
export function mean(arr: NumberArray): number {
  return sum(arr) / arr.length;
}

/**
 * Test an array of numbers for negative values.
 *
 * @param {number[]} arr - An array of numbers.
 * @return {boolean} - True or False, whether it contains negatives values or not.
 */
export function hasNegative(arr: NumberArray): boolean {
  for (let i = 0, l = arr.length; i < l; i += 1) {
    if (arr[i] < 0) return true;
  }
  return false;
}

/**
 * Test if an array contains duplicates.
 *
 * @param {array} arr
 * @returns {boolean}
 */
export function hasDuplicates(arr: []) {
  return (new Set(arr)).size !== arr.length;
}

/**
 * Return the haversine distance in kilometers between two points (lat/long coordinates).
 *
 * @param {[number, number]} A - Coordinates of the 1st point as [latitude, longitude].
 * @param {[number, number]} B - Coordinates of the 2nd point as [latitude, longitude].
 * @return {Number} distance - The distance in km between A and B.
 */
export function haversineDistance(A: [number, number], B: [number, number]) {
  const piDr = Math.PI / 180;

  const lat1 = +A[0];
  const lon1 = +A[1];
  const lat2 = +B[0];
  const lon2 = +B[1];

  const x1 = lat2 - lat1;
  const dLat = x1 * piDr;
  const x2 = lon2 - lon1;
  const dLon = x2 * piDr;

  const a = Msin(dLat / 2) * Msin(dLat / 2)
    + Mcos(lat1 * piDr) * Mcos(lat2 * piDr)
    * Msin(dLon / 2) * Msin(dLon / 2);
  return 6371 * 2 * Matan2(Msqrt(a), Msqrt(1 - a));
}

/**
 * Compute the Interquartile Range (IQR) of a dataset.
 *
 * @param {number[]} values - The dataset.
 * @returns {number} - The IQR.
 */
export function IQR(values: NumberArray): number {
  return d3.quantile(values, 0.75) as number - (d3.quantile(values, 0.25) as number);
}

export const lowerQuartile = (values: NumberArray): number => d3.quantile(values, 0.25) as number;

export const upperQuartile = (values: NumberArray): number => d3.quantile(values, 0.75) as number;

export const lowerWhisker = (values: NumberArray): number => Mmax(
  min(values),
  lowerQuartile(values) - 1.5 * IQR(values),
);

export const upperWhisker = (values: NumberArray): number => Mmin(
  max(values),
  upperQuartile(values) + 1.5 * IQR(values),
);

/**
 * Compute the bandwidth that will be used to plot kernel density estimation
 * of a dataset.
 * This is ported from the `bw.nrd0` function of the R stats package.
 *
 * @param values - The dataset
 * @returns {number} - The bandwidth
 */
export function getBandwidth(values: number[]): number {
  const hi = d3.deviation(values) as number;
  let lo = Mmin(hi, IQR(values) / 1.34);
  if (lo === 0) lo = hi || Mabs(values[0]) || 1;
  return 0.9 * lo * (values.length ** -0.2);
}

/**
 * Compute the kernel density estimation of a dataset.
 *
 * @param {function(number): number} kernel
 * @param {number[]} thresholds
 * @param {number[]} data
 */
export function kde(
  kernel: (x: number) => number,
  thresholds: number[],
  data: number[],
): [number, number | undefined][] {
  return thresholds
    .map((t) => [t, d3.mean(data, (d) => kernel(t - d))]);
}

/**
 * Epanechnikov kernel function for kernel density estimation.
 *
 * @param bandwidth - The bandwidth
 * @returns {function(number): number} - The kernel function
 */
export function epanechnikov(bandwidth: number) {
  return (x: number): number => {
    const xb = x / bandwidth;
    return Mabs(xb) <= 1
      ? (0.75 * (1 - x * x)) / bandwidth
      : 0;
  };
}

/**
 * Group a dataset by class, according to a set of breakpoints.
 *
 * @param {number[]} values - The dataset to be grouped in classes.
 * @param {number[]} breaks - The breakpoints to be used (they must be sorted,
 *                            unique and contain the min and max values of the dataset).
 */
export const groupByClass = (
  values: number[],
  breaks: number[],
): number[][] => {
  const sortedValues = values.slice().sort(ascending);
  // const groups: number[][] = [];
  // for (let i = 1; i < breaks.length; i += 1) {
  //   const hi = breaks[i];
  //   const lo = i === 1 ? -Infinity : breaks[i - 1];
  //   groups.push(values.filter((d) => d <= hi && d > lo));
  // }
  // return groups;
  return breaks.slice(1)
    .map((d, i) => sortedValues.filter((v) => v <= d && v > (i === 0 ? -Infinity : breaks[i])));
};

/**
 * Compute the TAI (tabular accuracy index) of a dataset for a given set of
 * breakpoints.
 * We use the same method as the one used in the R package `classInt`.
 *
 * @param {number[]} values - The values of the dataset to be classified.
 * @param {number[]} breakpoints - The breakpoints to be used for classification.
 * @return {number} - The TAI, as a number between 0 and 1.
 */
export const tabularAccuracyIndex = (values: number[], breakpoints: number[]): number => {
  const sumAbs = (x: number[]) => x.reduce((acc, val) => acc + Mabs(val - mean(x)), 0);
  const groups = groupByClass(values, breakpoints);
  const x = sumAbs(values);
  const y = groups.reduce((acc, col) => acc + sumAbs(col), 0);

  return 1 - (y / x);
};

/**
 * Compute the Goodness of variance fit (GVF) of a dataset for a given set of
 * breakpoints.
 * We use the same method as the one used in the R package `classInt` and
 * Python package `jenkspy` for example.
 *
 * @param {number[]} values - The values of the dataset to be classified.
 * @param {number[]} breaks - The breakpoints to be used for classification.
 * @return {number} - The goodness of variance fit.
 */
export const goodnessOfVarianceFit = (
  values: number[],
  breaks: number[],
): number => {
  const meanValue = mean(values);
  const sdam = sum(values.map((d) => (d - meanValue) ** 2));
  const groups = groupByClass(values, breaks);
  let sdcm = 0;
  for (let i = 0; i < groups.length; i += 1) {
    const groupMean = mean(groups[i]);
    sdcm += sum(groups[i].map((d) => (d - groupMean) ** 2));
  }
  return (sdam - sdcm) / sdam;
};
