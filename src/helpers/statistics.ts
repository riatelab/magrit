import { isNumber } from './common';

/**
 * Compute the Pearson correlation between two arrays (they must have the same length
 * but they can contain missing values).
 *
 * @param {any[]} x - The array for the first variable
 * @param {any[]} y - The array for the second variable
 * @returns {number}
 */
export function pearsonCorrelation(
  x: any[],
  y: any[],
): number {
  let xs = x.slice();
  let ys = y.slice();
  let n = xs.length;
  const mean = (l: number[]) => l.reduce((s, a) => s + a, 0) / l.length;
  const calc = (v: number[], m: number) => Math.sqrt(
    v.reduce((s, a) => (s + a * a), 0) - n * m * m,
  );
  let nn = 0;
  for (let i = 0; i < n; i += 1, nn += 1) {
    // if ((!xs[i] && xs[i] !== 0) || (!ys[i] && ys[i] !== 0)) {
    if (!isNumber(xs[i]) || !isNumber(ys[i])) {
      nn -= 1;
      // eslint-disable-next-line no-continue
      continue;
    }
    xs[nn] = +xs[i] as number;
    ys[nn] = +ys[i] as number;
  }
  if (n !== nn) {
    xs = xs.splice(0, nn);
    ys = ys.splice(0, nn);
    n = nn;
  }
  const meanX = mean(xs);
  const meanY = mean(ys);
  return (xs
    .map((e, i) => ({ x: e, y: ys[i] }))
    .reduce((v, a) => v + a.x * a.y, 0) - n * meanX * meanY
  ) / (calc(xs, meanX) * calc(ys, meanY));
}

/**
 * Compute the Spearman correlation between two arrays (they must have the same length
 * but they can contain missing values).
 *
 * @param {any[]} x - The array for the first variable
 * @param {any[]} y - The array for the second variable
 */
export function spearmanCorrelation(
  x: any[],
  y: any[],
): number {
  const n = x.length;
  const rank = (arr: any[]) => arr
    .map((v, i) => ({ v, i }))
    .sort((a, b) => a.v - b.v)
    .map((a, i) => ({ ...a, r: i + 1 }))
    .sort((a, b) => a.i - b.i)
    .map((a) => a.r);
  const rankX = rank(x);
  const rankY = rank(y);
  const sum = rankX
    .map((r, i) => r - rankY[i])
    .reduce((s, d) => s + d * d, 0);
  return 1 - (6 * sum) / (n * (n * n - 1));
}

/**
 * Compute the correlation matrix between the variables of a dataset.
 *
 * @param {Record<string, any>[]} dataset - The dataset
 * @param {string[]} variables - The variables
 * @param {('pearson' | 'spearman')} type - The type of correlation
 * @returns {object[]} - The correlation matrix
 */
export function makeCorrelationMatrix(
  dataset: Record<string, any>[],
  variables: string[],
  type: 'pearson' | 'spearman' = 'pearson',
): { a: string, b: string, correlation: number }[] {
  const corr = type === 'pearson' ? pearsonCorrelation : spearmanCorrelation;
  const n = variables.length;
  const matrix = [];
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      matrix.push({
        a: variables[i],
        b: variables[j],
        correlation: corr(
          dataset.map((d) => d[variables[i]]),
          dataset.map((d) => d[variables[j]]),
        ),
      });
    }
  }
  return matrix;
}
