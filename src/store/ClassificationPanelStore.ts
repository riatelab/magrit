import { createStore } from 'solid-js/store';
import { ClassificationMethod, ClassificationParameters } from '../global';

type ClassificationPanelStoreType = {
  show: boolean,
  layerName?: string,
  series?: any[],
  classificationParameters?: ClassificationParameters,
  onConfirm?: (classification: ClassificationParameters) => void,
  onCancel?: () => void,
};

const [
  classificationPanelStore,
  setClassificationPanelStore,
] = createStore({
  show: false,
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
