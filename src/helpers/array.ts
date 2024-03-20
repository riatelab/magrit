const zip = (...rows: never[]) => [...rows[0]].map((_, c) => rows.map((row) => row[c]));

const noop = () => {};

export {
  noop,
  zip,
};
