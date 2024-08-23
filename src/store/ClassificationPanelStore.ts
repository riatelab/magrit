import { createStore } from 'solid-js/store';
import type { ClassificationParameters, DiscontinuityParameters } from '../global';

type ClassificationPanelStoreType = {
  show: boolean,
  type?: 'color' | 'size',
  layerName?: string,
  series?: any[],
  classificationParameters?: ClassificationParameters | DiscontinuityParameters,
  onConfirm?: (classification: ClassificationParameters | DiscontinuityParameters) => void,
  onCancel?: () => void,
};

const [
  classificationPanelStore,
  setClassificationPanelStore,
] = createStore({
  show: false,
  type: undefined,
  layerName: undefined,
  series: undefined,
  classificationParameters: undefined,
  onConfirm: undefined,
  onCancel: undefined,
} as ClassificationPanelStoreType);

export {
  classificationPanelStore,
  setClassificationPanelStore,
};
