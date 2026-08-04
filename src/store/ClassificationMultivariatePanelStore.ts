import { createStore } from 'solid-js/store';
import type { BivariateChoroplethParameters, TrivariateChoroplethParameters } from '../global';

type ClassificationMultivariatePanelStoreType = {
  show: boolean,
  type?: 'bivariate' | 'trivariate',
  layerName?: string,
  series?: any[][],
  classificationParameters?: BivariateChoroplethParameters | TrivariateChoroplethParameters,
  onConfirm?: (classification: any) => void,
  onCancel?: () => void,
};

const [
  classificationMultivariatePanelStore,
  setClassificationMultivariatePanelStore,
] = createStore({
  show: false,
  type: undefined,
  layerName: undefined,
  series: undefined,
  classificationParameters: undefined,
  onConfirm: undefined,
  onCancel: undefined,
} as ClassificationMultivariatePanelStoreType);

export {
  classificationMultivariatePanelStore,
  setClassificationMultivariatePanelStore,
};
