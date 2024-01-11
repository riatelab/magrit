import {
  ArithmeticProgressionClassifier,
  CustomBreaksClassifier,
  EqualClassifier,
  GeometricProgressionClassifier,
  HeadTailClassifier,
  JenksClassifier,
  MsdClassifier,
  PrettyBreaksClassifier,
  QuantileClassifier,
  Q6Classifier,
  q6,
  quantile,
  equal,
  jenks,
  headtail,
  geometricProgression,
  arithmeticProgression,
  pretty,
  nestedMeans,
  msd,
} from 'statsbreaks';
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
    default:
      throw new Error(`No classification function for method "${method}".`);
  }
};

export const noop = () => {};
