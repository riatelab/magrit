export function unproxify(value: any): any {
  if (Array.isArray(value)) {
    const result = [];
    const l = value.length;
    for (let i = 0; i < l; i += 1) {
      result.push(unproxify(value[i]));
    }
    return result;
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, any> = {};
    const entries = Object.entries(value);
    const l = entries.length;
    for (let i = 0; i < l; i += 1) {
      result[entries[i][0]] = unproxify(entries[i][1] as never);
    }
    return result;
  }
  return value;
}

/**
 * Custom function to check if a value is a finite number.
 * It should only return true for finite number or the string
 * representation of a finite number.
 * We use this function to check if we have a numerical value to be
 * used for a given feature or if we should handle it as "no data" for example.
 *
 * @param value
 * @returns {boolean}
 */
export function isFiniteNumber(value: any): boolean {
  return value !== null
    && value !== ''
    && !(typeof value === 'boolean')
    // eslint-disable-next-line no-restricted-globals
    && isFinite(value);
}

/**
 * Custom function to check if we have a value (so this is not null,
 * undefined or an empty string) or if we should handle
 * it as "no data" for example.
 *
 * @param value
 * @returns {boolean}
 */
export function isNonNull(value: any): boolean {
  return value !== null && value !== undefined && value !== '';
}

/**
 * Custom function to check if a value is a positive finite number.
 * @param value
 * @returns {boolean}
 */
export const isPositiveFiniteNumber = (value: any): boolean => {
  if (!isFiniteNumber(value)) {
    return false;
  }
  if (+value <= 0) {
    return false;
  }
  return true;
};

export const ascending = (a: number, b: number) => a - b;

export const ascendingKeyAccessor = (
  keyAccessor: (d: any) => any,
) => (a: any, b: any) => ascending(keyAccessor(a), keyAccessor(b));

export const descending = (a: number, b: number) => b - a;

export const descendingKeyAccessor = (
  keyAccessor: (d: any) => any,
) => (a: any, b: any) => descending(keyAccessor(a), keyAccessor(b));

/**
 * Debounce a function. Returns a function, that, as long as it continues to be invoked,
 * will not be triggered.
 * The function will be called after it stops being called for 'delay' milliseconds.
 * @param func - The function to debounce.
 * @param {number} [delay=300] - The number of milliseconds to delay.
 * @param {boolean} [immediate=false] - Trigger the function immediately.
 */
export const debounce = (
  func: (...args: any[]) => any,
  delay: number = 300,
  immediate: boolean = false,
) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    if (immediate && !timeoutId) {
      func.apply(this, args);
    }
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

export const getNumberOfDecimals = (value: number) => {
  if (Math.floor(value) !== value) {
    return value.toString().split('.')[1].length || 0;
  }
  return 0;
};

export const capitalizeFirstLetter = (str: string): string => str[0].toUpperCase() + str.slice(1);

/**
 * Find a suitable name for a new layer.
 * It searches for the first available name in the form 'Layer (1)', 'Layer (2)', etc.
 * (and knowing that there might be existing layers with names 'Layer', 'Layer (1)', etc.)
 *
 * @param {string} name - The name to start with.
 * @param {Array<string>} existingNames - The list of existing layer names.
 * @returns {string} - The first available name.
 */
export const findSuitableName = (name: string, existingNames: Array<string>): string => {
  const exp = /\s\((\d+)\)$/;
  const cleanNames = existingNames.map((n) => n.replace(exp, ''));
  const cleanName = name.replace(exp, '');
  if (!cleanNames.includes(cleanName) && !existingNames.includes(name)) {
    return name;
  }
  let i = 1;
  while (existingNames.includes(`${cleanName} (${i})`)) {
    i += 1;
  }
  return `${name.replace(exp, '')} (${i})`;
};

export const splitLastOccurrence = (str: string, substring: string) => {
  const lastIndex = str.lastIndexOf(substring);
  return [str.slice(0, lastIndex), str.slice(lastIndex + 1)];
};

export function sleep(time: number): Promise<void> {
  return new Promise((resolve) => { setTimeout(resolve, time); });
}

export const getMinimumPrecision = (arr: number[]) => {
  let minDiff = Infinity;

  for (let i = 0; i < arr.length - 1; i += 1) {
    for (let j = i + 1; j < arr.length; j += 1) {
      const diff = Math.abs(arr[i] - arr[j]);
      if (diff > 0 && diff < minDiff) {
        minDiff = diff;
      }
    }
  }

  return minDiff === Infinity ? 0 : Math.ceil(-Math.log10(minDiff));
};

export const precisionToMinimumFractionDigits = (precision: number) => {
  if (precision < 0) {
    return 0;
  }
  if (precision > 100) {
    return 100;
  }
  return precision;
};

/**
 * Replace all null values in an array of objects by undefined (returns a new array
 * with new objects).
 * @param {Array<Record<string, any>>} obj - The array of objects.
 * @returns {Array<Record<string, any>>} - The array of objects with replaced null values.
 */
export const replaceNullByUndefined = (
  obj: Record<string, any>[],
): Record<string, any>[] => {
  const res = [];
  const keys = Object.keys(obj[0]);
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < obj.length; i++) {
    const o = { ...obj[i] };
    // eslint-disable-next-line no-plusplus
    for (let j = 0; j < keys.length; j++) {
      if (o[keys[j]] === null) {
        o[keys[j]] = undefined;
      }
    }
    res.push(o);
  }
  return res;
};

/* eslint-disable no-return-assign, no-param-reassign, no-sequences */
export const camelToFlat = (c: string) => (
  c = c.replace(/[A-Z]|([0-9]+)/g, ' $&'), c[0].toUpperCase() + c.slice(1)).trim();
/* eslint-enable no-return-assign, no-param-reassign, no-sequences */

/**
 * Deduplicate an array of numbers and return the unique values
 * in a new array.
 * @param {Array<number>} values - The array of numbers to deduplicate.
 * @returns {Array<number>} - The array of unique values.
 */
export const getUniqueValues = (values: number[]) => Array.from(new Set(values));

/**
 * Sanitize a column name by replacing special characters with spaces.
 * @param {string} c - The column name to sanitize.
 * @returns {string} - The sanitized column name.
 */
export const sanitizeColumnName = (c: string) => c.replace(/[\r\n]+/g, ' ')
  .replace(/[.,/#!$%^&*;:{}=`~()]/g, ' ')
  .replace(/\s{2,}/g, ' ')
  .replaceAll('\'', '-');

/**
 * Replace diacritics in a string with their non-diacritic equivalent.
 * @param {string} str - The string to sanitize.
 * @returns {string} - The sanitized string.
 */
export const removeDiacritics = (str: string) => str.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

/**
 * Check if two numbers are equal within a given epsilon
 * (given as a precision value).
 * @param {number} a - The first number.
 * @param {number} b - The second number.
 * @param {number} precision - The precision value.
 */
export const isEqual = (a: number, b: number, precision: number): boolean => {
  const epsilon = 10 ** -precision;
  return Math.abs(a - b) < epsilon;
};

/**
 * Check if a number is strictly greater than another within a given epsilon
 * (given as a precision value).
 * @param {number} a - The first number (the number to check if it is greater).
 * @param {number} b - The second number.
 * @param {number} precision - The precision value.
 */
export const isGreaterThan = (a: number, b: number, precision: number): boolean => {
  const epsilon = 10 ** -precision;
  return a - b > epsilon;
};

/**
 * Check if a number is strictly less than another within a given epsilon
 * (given as a precision value).
 * @param {number} a - The first number (the number to check if it is less).
 * @param {number} b - The second number.
 * @param {number} precision - The precision value.
 */
export const isLessThan = (a: number, b: number, precision: number): boolean => {
  const epsilon = 10 ** -precision;
  return b - a > epsilon;
};

/**
 * Check if a number is greater than or equal to another within a given epsilon
 * (given as a precision value).
 * @param {number} a - The first number (the number to check if it is less).
 * @param {number} b - The second number.
 * @param {number} precision - The precision value.
 */
export const isLessThanOrEqual = (a: number, b: number, precision: number): boolean => (
  isLessThan(a, b, precision) || isEqual(a, b, precision)
);

/**
 * Check if a number is less than or equal to another within a given epsilon
 * (given as a precision value).
 * @param {number} a - The first number (the number to check if it is greater).
 * @param {number} b - The second number.
 * @param {number} precision - The precision value.
 */
export const isGreaterThanOrEqual = (a: number, b: number, precision: number): boolean => (
  isGreaterThan(a, b, precision) || isEqual(a, b, precision)
);

/**
 * Test if an array contains duplicates.
 *
 * @param {any[]} arr
 * @returns {boolean}
 */
export function hasDuplicates(arr: any[]): boolean {
  return (new Set(arr)).size !== arr.length;
}

/**
 * Count the number of occurrences of each value in an array.
 *
 * @param {any[]} arr - The array to count occurrences in.
 * @return {Record<string, number>} - An object where keys are the values
 * from the array and values are their counts.
 */
export function countOccurrences(arr: any[]): Record<string, number> {
  return arr.reduce((acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
