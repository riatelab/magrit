export function unproxify(value: typeof Proxy<(Array<any> | object)>): (Array<any> | object) {
  if (value instanceof Array) {
    return value.map(unproxify);
  }
  if (value instanceof Object) {
    return Object.fromEntries(
      Object.entries({ ...value })
        .map(([k, v]) => [k, unproxify(v as never)]),
    );
  }
  return value;
}

export function isNumber(value: any): boolean {
  // eslint-disable-next-line no-restricted-globals
  return value !== null && value !== '' && isFinite(value);
}

export function isNonNull(value: any): boolean {
  return value !== null && value !== undefined && value !== '';
}

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
 * @param {number} delay - The number of milliseconds to delay.
 * @param {boolean} [immediate] - Trigger the function immediately.
 */
export const debounce = (func: (...args: any[]) => any, delay: number, immediate?: boolean) => {
  let timerId: number | undefined;
  return (...args: any[]) => {
    const boundFunc = func.bind(this, ...args);
    clearTimeout(timerId);
    if (immediate && !timerId) {
      boundFunc();
    }
    const calleeFunc = immediate ? () => {
      timerId = undefined;
    } : boundFunc;
    timerId = setTimeout(calleeFunc, delay);
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
  // FIXME: there seems to be a bug here (when adding a new layer that is already named 'Layer (1)')
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
  return `${name} (${i})`;
};

export const splitLastOccurrence = (str: string, substring: string) => {
  const lastIndex = str.lastIndexOf(substring);
  return [str.slice(0, lastIndex), str.slice(lastIndex + 1)];
};
