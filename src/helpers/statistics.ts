import * as ss from 'simple-statistics';
import lowess from '@stdlib/stats-lowess';
import cdf from '@stdlib/stats-base-dists-t-cdf';

import { isFiniteNumber } from './common';
import {
  Mabs, Mceil, Mfloor, Mpow, Msqrt,
} from './math';

export interface LinearRegressionOptions {
  x: string,
  y: string,
  logX: boolean,
  logY: boolean,
}

export interface MultipleLinearRegressionOptions {
  x: string[],
  y: string,
  logX: boolean[],
  logY: boolean,
}

export interface LinearRegressionResult {
  adjustedRSquared: number,
  rSquared: number,
  coefficients: {
    // Estimate, Std. Error, t-value, Pr(>|t|)
    'X.Intercept': [number, number, number, number],
    [key: string]: [number, number, number, number],
  },
  residuals: (number | null)[],
  fittedValues: (number | null)[],
  pearson: number,
  spearman: number,
  ignored: number,
  standardisedResiduals: (number | null)[],
  residualStandardError: number,
  lowessFittedResiduals: { x: number[], y: number[] },
  lowessStandardisedResiduals: { x: number[], y: number[] },
  qqPoints: { x: number[], y: number[] },
  qqLine: { slope: number, intercept: number },
  options: LinearRegressionOptions,
}

export interface MultipleLinearRegressionResult {
  rSquared: number,
  adjustedRSquared: number,
  coefficients: number[],
  residuals: number[],
  fittedValues: number[],
  standardisedResiduals: number[],
  residualStandardError: number,
  ignored: number,
  lowessFittedResiduals: { x: number[], y: number[] },
  lowessStandardisedResiduals: { x: number[], y: number[] },
  qqPoints: { x: number[], y: number[] },
  qqLine: { slope: number, intercept: number },
  options: MultipleLinearRegressionOptions,
}

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
    if (!isFiniteNumber(xs[i]) || !isFiniteNumber(ys[i])) {
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

/**
 * Implements the quantile function for type 7 (R quantile function)
 * which is the default quantile function in R but gives different
 * results than simplestatistics.quantile.
 *
 * @param data
 * @param q
 */
function quantileType7(
  data: number[],
  q: number,
) {
  // Sort data
  const sortedData = data.slice().sort((a, b) => a - b);
  const n = sortedData.length;

  // Compute the position of the quantile
  const pos = (q * (n - 1)) + 1;

  // Handle edge cases where the quantile is exactly the first of the last element
  if (pos <= 1) {
    return sortedData[0];
  }
  if (pos >= n) {
    return sortedData[n - 1];
  }

  // Linear interpolation for non-integer positions
  const lowerIndex = Mfloor(pos) - 1; // we use 0-based indexing
  const upperIndex = Mceil(pos) - 1; // we use 0-based indexing
  const fraction = pos - Mfloor(pos);

  return sortedData[lowerIndex] + fraction * (sortedData[upperIndex] - sortedData[lowerIndex]);
}

/**
 * Compute the p-value for a t-value and a number of degrees of freedom.
 *
 * @param {number} t - The t-value
 * @param {number} df - The number of degrees of freedom
 * @returns {number} - The p-value
 */
function pValue(t: number, df: number): number {
  return 2 * (1 - cdf(Mabs(t), df));
}

export function computeLinearRegression(
  dataset: Record<string, any>[],
  options: LinearRegressionOptions,
) : LinearRegressionResult {
  // Extract values for the variables, replace non numbers / missing
  // with null
  const x = dataset.map((d) => {
    const v = d[options.x];
    if (isFiniteNumber(v)) {
      return +v;
    }
    return null;
  });
  const y = dataset.map((d) => {
    const v = d[options.y];
    if (isFiniteNumber(v)) {
      return +v;
    }
    return null;
  });

  // Simple statistics wants arrays of [x, y] pairs
  // (with nulls removed).
  // We also keep track of how many values are missing
  // (how many pairs have at least one null)
  let ignored = 0;

  const d: number[][] = [];
  for (let i = 0, n = x.length; i < n; i += 1) {
    if (x[i] !== null && y[i] !== null) {
      d.push([x[i] as number, y[i] as number]);
    } else {
      ignored += 1;
    }
  }
  // Get slope (m) and intercept (b)
  const lm = ss.linearRegression(d);
  const lmLine = ss.linearRegressionLine(lm);

  // Compute Rsquared
  const rSquared = ss.rSquared(d, lmLine);

  // Compute adjusted Rsquared
  const adjustedRSquared = 1 - (1 - rSquared) * ((d.length - 1) / (d.length - 2));

  // Compute the residuals, the fitted values and the standardised residuals
  // (this time we keep the nulls)
  const residuals = x.map((v, i) => {
    if (v === null || y[i] === null) {
      return null;
    }
    return y[i] as number - lmLine(v as number);
  });

  const fittedValues = x.map((v, i) => {
    if (v === null || y[i] === null) {
      return null;
    }
    return lmLine(v as number);
  });

  const rse = Msqrt(
    residuals
      .map((r) => (r === null ? 0 : r * r))
      .reduce((s, v) => s + v, 0) / (d.length - 2),
  );

  const sd = ss.standardDeviation(residuals.filter((v) => v !== null) as number[]);

  // Compute the standardised residuals and the residual standard error
  const standardisedResiduals = residuals.map((v) => {
    if (v === null) {
      return null;
    }
    // Compute the standardised residual, as in R
    return v / sd;
  });
  const filteredStandardisedResiduals = standardisedResiduals.filter((v) => v !== null) as number[];

  // For the Fitted vs. Residuals plot, we need to compute
  // the lowess smoothed values
  const lowessFittedResiduals = lowess(
    fittedValues.filter((v) => v !== null),
    residuals.filter((v) => v !== null),
  );

  // For the Scale-Location plot we also need to compute the
  // lowess smoothed values
  const lowessStandardisedResiduals = lowess(
    fittedValues.filter((v) => v !== null),
    filteredStandardisedResiduals.map((v) => Msqrt(Mabs(v as number))),
  );

  // The qqPoints is what we would get by calling qqnorm on the
  // standardised residuals in R.
  const qqPoints: { x: number[], y: number[] } = { x: [], y: [] };
  filteredStandardisedResiduals
    .slice()
    .sort((a, b) => <number>a - <number>b)
    .forEach((v, i) => {
      qqPoints.x.push(ss.probit((i + 1) / (standardisedResiduals.length + 1)));
      qqPoints.y.push(v as number);
    });

  const qqLineX = [
    quantileType7(filteredStandardisedResiduals, 0.25),
    quantileType7(filteredStandardisedResiduals, 0.75),
  ];
  const qqLineY = [-0.6744898, 0.6744898]; // qnorm(c(0.25, 0.75)) in R
  const qqLine = {
    slope: (qqLineX[1] - qqLineX[0]) / (qqLineY[1] - qqLineY[0]),
    intercept: qqLineX[0] - qqLineY[0] * ((qqLineX[1] - qqLineX[0]) / (qqLineY[1] - qqLineY[0])),
  };

  // We want to compute the coefficients, the standard errors, the t-values
  // and the value Pr(>|t|)
  // Compute sum of squared errors (SSE)
  const SSE = d.reduce((sum, point) => {
    const [px, py] = point;
    const estimatedY = lm.m * px + lm.b;
    return sum + Mpow(py - estimatedY, 2);
  }, 0);

  // Compute the variance of x
  const meanX = ss.mean(d.map((point) => point[0]));
  const varianceX = ss.sum(d.map((point) => Mpow(point[0] - meanX, 2)));

  // Compute the standard error for slope and intercept
  const n = d.length;
  const stdErrorSlope = Msqrt(SSE / (n - 2) / varianceX);
  const stdErrorIntercept = Msqrt((SSE / (n - 2)) * (1 / n + Mpow(meanX, 2) / varianceX));

  // Compute t-values
  const tValueSlope = lm.m / stdErrorSlope;
  const tValueIntercept = lm.b / stdErrorIntercept;

  // Compute p-values
  const df = n - 2; // Degrees of freedom
  const pValueSlope = pValue(tValueSlope, df);
  const pValueIntercept = pValue(tValueIntercept, df);

  return {
    adjustedRSquared,
    rSquared,
    coefficients: {
      'X.Intercept': [lm.b, stdErrorIntercept, tValueIntercept, pValueIntercept],
      [options.y]: [lm.m, stdErrorSlope, tValueSlope, pValueSlope],
    },
    residuals,
    fittedValues,
    pearson: pearsonCorrelation(x, y),
    spearman: spearmanCorrelation(x, y),
    ignored,
    standardisedResiduals,
    residualStandardError: rse,
    lowessFittedResiduals: lowessFittedResiduals as { x: number[], y: number[] },
    lowessStandardisedResiduals: lowessStandardisedResiduals as { x: number[], y: number[] },
    qqPoints,
    qqLine,
    options,
  };
}
