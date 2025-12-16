// Imports from solid-js
import type { Accessor } from 'solid-js';

// Imports from other external libraries
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

// Helpers
import d3 from './d3-custom';
import type { TranslationFunctions } from '../i18n/i18n-types';
import { getMinimumPrecision } from './common';
import { extent, hasNegative } from './math';

// Stores
import { applicationSettingsStore } from '../store/ApplicationSettingsStore';

// Types, interfaces and enums
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
  const mean = d3.mean(series) as number;

  // We compute the variance without the Bessel correction
  const variance = d3.sum(series.map((d) => (d - mean) ** 2)) / series.length;
  const standardDeviation = Math.sqrt(variance);
  return {
    population: series.length,
    unique: new Set(series).size,
    minimum: min,
    maximum: max,
    mean,
    median: d3.median(series) as number,
    standardDeviation,
    precision: getMinimumPrecision(series),
    // variance,
    // varianceCoefficient: standardDeviation / mean,
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
  const classifier = new Cls(values, null, applicationSettingsStore.intervalClosure, breaks);
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

export const bivariateClass = (
  v1: any,
  v2: any,
  c1: { getClass: (_: number) => number },
  c2: { getClass: (_: number) => number },
): number => (
  3 * c1.getClass(v1) + c2.getClass(v2)
);

export const makeClassificationMenuEntries = (
  LL: Accessor<TranslationFunctions>,
  nbUnique: number,
  allValuesSuperiorToZero: boolean,
) => [
  {
    name: LL().ClassificationPanel.classificationMethods.quantiles(),
    value: ClassificationMethod.quantiles,
    options: [OptionsClassification.numberOfClasses],
  },
  {
    name: LL().ClassificationPanel.classificationMethods.equalIntervals(),
    value: ClassificationMethod.equalIntervals,
    options: [OptionsClassification.numberOfClasses],
  },
  nbUnique > 6 ? {
    name: LL().ClassificationPanel.classificationMethods.q6(),
    value: ClassificationMethod.q6,
    options: [],
  } : null,
  {
    name: LL().ClassificationPanel.classificationMethods.ckmeans(),
    value: ClassificationMethod.ckmeans,
    options: [OptionsClassification.numberOfClasses],
  },
  {
    name: LL().ClassificationPanel.classificationMethods.jenks(),
    value: ClassificationMethod.jenks,
    options: [OptionsClassification.numberOfClasses],
  },
  {
    name: LL().ClassificationPanel.classificationMethods.standardDeviation(),
    value: ClassificationMethod.standardDeviation,
    options: [OptionsClassification.amplitude, OptionsClassification.meanPosition],
  },
  allValuesSuperiorToZero ? {
    name: LL().ClassificationPanel.classificationMethods.geometricProgression(),
    value: ClassificationMethod.geometricProgression,
    options: [OptionsClassification.numberOfClasses],
  } : null,
  {
    name: LL().ClassificationPanel.classificationMethods.nestedMeans(),
    value: ClassificationMethod.nestedMeans,
    options: [OptionsClassification.constrainedNumberOfClasses],
  },
  {
    name: LL().ClassificationPanel.classificationMethods.headTail(),
    value: ClassificationMethod.headTail,
    options: [],
  },
  {
    name: LL().ClassificationPanel.classificationMethods.manual(),
    value: ClassificationMethod.manual,
    options: [OptionsClassification.breaks, OptionsClassification.numberOfClasses],
  },
].filter((d) => d !== null);
