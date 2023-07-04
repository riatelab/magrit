export const Mmax = Math.max;
export const Mmin = Math.min;
export const Mabs = Math.abs;
export const Mpow = Math.pow; // eslint-disable-line no-restricted-properties
export const Msqrt = Math.sqrt;
export const Mround = Math.round;
export const Mceil = Math.ceil;
export const Mfloor = Math.floor;
export const Mlog = Math.log;
export const Mexp = Math.exp;
export const Msin = Math.sin;
export const Mcos = Math.cos;
export const Matan = Math.atan;
export const Matan2 = Math.atan2;
export const Mtan = Math.tan;

/**
 * Rounds a number to a specified number of decimal places.
 * @param {number} num
 * @param {number} [decimalPlaces=2]
 * @returns {number}
 */
export function round(num: number, decimalPlaces = 2): number {
  const exponent = decimalPlaces || 0;
  const p = 10 ** exponent;
  return Math.round((num * p) * (1 + Number.EPSILON)) / p;
}

/**
 * Returns the minimum value of an array of numbers.
 * @param {number[]} arr
 * @returns {number}
 */
export function min(arr: number[]): number {
  let minVal = Infinity;
  for (let i = 0, l = arr.length; i < l; i += 1) {
    if (arr[i] < minVal) {
      minVal = arr[i];
    }
  }
  return minVal;
}

/**
 * Returns the maximum value of an array of numbers.
 * @param {number[]} arr
 * @returns {number}
 */
export function max(arr: number[]): number {
  let maxVal = -Infinity;
  for (let i = 0, l = arr.length; i < l; i += 1) {
    if (arr[i] > maxVal) {
      maxVal = arr[i];
    }
  }
  return maxVal;
}

/**
 * Test an array of numbers for negative values.
 *
 * @param {number[]} arr - An array of numbers.
 * @return {boolean} - True or False, whether it contains negatives values or not
 */
export function hasNegative(arr: number[]) {
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
 * Return the haversine distance in kilometers between two points (lat/long coordinates)
 *
 * @param {[number, number]} A - Coordinates of the 1st point as [latitude, longitude]
 * @param {[number, number]} B - Coordinates of the 2nd point as [latitude, longitude]
 * @return {Number} distance - The distance in km between A and B
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
