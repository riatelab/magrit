import {
  ArithmeticProgressionClassifier,
  CustomBreaksClassifier,
  CkmeansClassifier,
  EqualClassifier,
  GeometricProgressionClassifier,
  HeadTailClassifier,
  JenksClassifier,
  MsdClassifier,
  NestedMeansClassifier,
  PrettyBreaksClassifier,
  QuantileClassifier,
  Q6Classifier,
  q6,
  quantile,
  equal,
  jenks,
  ckmeans,
  headtail,
  geometricProgression,
  arithmeticProgression,
  pretty,
  nestedMeans,
  msd,
} from 'statsbreaks';

import d3 from './d3-custom';
import { getMinimumPrecision } from './common';
import { extent, hasNegative } from './math';

import { ClassificationMethod } from '../global.d';

export const getClassifier = (method: ClassificationMethod) => {
  switch (method) {
    case ClassificationMethod.arithmeticProgression:
      return ArithmeticProgressionClassifier();
    case ClassificationMethod.manual:
      return CustomBreaksClassifier;
    case ClassificationMethod.equalIntervals:
      return EqualClassifier;
    case ClassificationMethod.geometricProgression:
      return GeometricProgressionClassifier;
    case ClassificationMethod.headTail:
      return HeadTailClassifier;
    case ClassificationMethod.jenks:
      return JenksClassifier;
    case ClassificationMethod.standardDeviation:
      return MsdClassifier;
    case ClassificationMethod.pretty:
      return PrettyBreaksClassifier;
    case ClassificationMethod.quantiles:
      return QuantileClassifier;
    case ClassificationMethod.q6:
      return Q6Classifier;
    case ClassificationMethod.nestedMeans:
      return NestedMeansClassifier;
    case ClassificationMethod.ckmeans:
      return CkmeansClassifier;
    default:
      throw new Error(`Unknown classification method: ${method}`);
  }
};

export const getClassificationFunction = (method: ClassificationMethod) => {
  switch (method) {
    case ClassificationMethod.arithmeticProgression:
      return arithmeticProgression;
    case ClassificationMethod.equalIntervals:
      return equal;
    case ClassificationMethod.geometricProgression:
      return geometricProgression;
    case ClassificationMethod.headTail:
      return headtail;
    case ClassificationMethod.jenks:
      return jenks;
    case ClassificationMethod.standardDeviation:
      return msd;
    case ClassificationMethod.pretty:
      return pretty;
    case ClassificationMethod.quantiles:
      return quantile;
    case ClassificationMethod.q6:
      return q6;
    case ClassificationMethod.nestedMeans:
      return nestedMeans;
    case ClassificationMethod.ckmeans:
      return ckmeans;
    default:
      throw new Error(`No classification function for method "${method}".`);
  }
};

export function prepareStatisticalSummary(series: number[]) {
  const [min, max] = extent(series);

  return {
    population: series.length,
    unique: new Set(series).size,
    minimum: min,
    maximum: max,
    mean: d3.mean(series) as number,
    median: d3.median(series) as number,
    standardDeviation: d3.deviation(series) as number,
    precision: getMinimumPrecision(series),
    // variance: d3.variance(series),
    // varianceCoefficient: d3.deviation(series) / d3.mean(series),
  };
}

export function parseUserDefinedBreaks(
  series: number[],
  breaksString: string,
  statSummary: ReturnType<typeof prepareStatisticalSummary>,
): number[] {
  const separator = hasNegative(series) ? '- ' : '-';
  let breaks = breaksString.split(separator).map((d) => +d);
  // Filter / modify the breaks so that the first value is the minimum of the series
  // and the last value is the maximum of the series
  breaks = breaks.filter((d) => d > statSummary.minimum && d < statSummary.maximum);
  breaks = [statSummary.minimum, ...breaks, statSummary.maximum];
  breaks = [...new Set(breaks)].sort((a, b) => a - b);
  if (breaks.length < 3) {
    throw new Error('The number of classes must be at least 2.');
  }
  return breaks;
}

export function getEntitiesByClass(
  values: number[],
  breaks: number[],
) {
  const Cls = getClassifier(ClassificationMethod.manual);
  const classifier = new Cls(values, null, breaks);
  return classifier.countByClass();
}

export enum OptionsClassification {
  numberOfClasses,
  amplitude,
  meanPosition,
  breaks,
  constrainedNumberOfClasses,
}

export const classificationMethodHasOption = (
  option: OptionsClassification,
  method: ClassificationMethod,
  entries: { value: ClassificationMethod, name: any, options: OptionsClassification[] }[],
): boolean => {
  const t = entries.find((e) => e.value === method);
  if (!t || !t.options) {
    return false;
  }
  return t.options.includes(option);
};
