export function round(num: number, decimalPlaces = 2): number {
  const exponent = decimalPlaces || 0;
  const p = 10 ** exponent;
  return Math.round((num * p) * (1 + Number.EPSILON)) / p;
}

export function noop() {}
