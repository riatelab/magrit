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
import { ClassificationMethod } from '../global.d';

export const getClassifier = (method: ClassificationMethod) => {
  switch (method) {
    case ClassificationMethod.arithmeticProgression:
      return ArithmeticProgressionClassifier();
    case ClassificationMethod.manual:
      return CustomBreaksClassifier;
    case ClassificationMethod.equalInterval:
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
    case ClassificationMethod.quantile:
      return QuantileClassifier;
    case ClassificationMethod.q6:
      return Q6Classifier;
    default:
      throw new Error(`Unknown classification method: ${method}`);
  }
};

export const noop = () => {};
