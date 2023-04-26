export function unproxify(value: Proxy<(Array<any> | object)>): (Array<any> | object) {
  if (value instanceof Array) {
    return value.map(unproxify);
  }
  if (value instanceof Object) {
    return Object.fromEntries(
      Object.entries({ ...value })
        .map(([k, v]) => [k, unproxify(v)]),
    );
  }
  return value;
}

export function noop() {}
