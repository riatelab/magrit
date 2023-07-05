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
} from 'statsbreaks';
import { ClassificationMethods } from '../global.d';

export const getClassifier = (method: ClassificationMethods) => {
  switch (method) {
    case ClassificationMethods.arithmeticProgression:
      return ArithmeticProgressionClassifier();
    case ClassificationMethods.manual:
      return CustomBreaksClassifier;
    case ClassificationMethods.equalInterval:
      return EqualClassifier;
    case ClassificationMethods.geometricProgression:
      return GeometricProgressionClassifier;
    case ClassificationMethods.headTail:
      return HeadTailClassifier;
    case ClassificationMethods.jenks:
      return JenksClassifier;
    case ClassificationMethods.standardDeviation:
      return MsdClassifier;
    case ClassificationMethods.pretty:
      return PrettyBreaksClassifier;
    case ClassificationMethods.quantile:
      return QuantileClassifier;
    case ClassificationMethods.q6:
      return Q6Classifier;
    default:
      throw new Error(`Unknown classification method: ${method}`);
  }
};

export const noop = () => {};
