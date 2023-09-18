import { createStore } from 'solid-js/store';
import { ClassificationMethod } from '../global';

type ClassificationPanelStoreType = {
  show: boolean,
  layerName?: string,
  variableName?: string,
  series?: any[],
  classificationMethod?: ClassificationMethod,
  nClasses?: number,
  colorScheme?: string,
  invertColorScheme?: boolean,
};

const [
  classificationPanelStore,
  setClassificationPanelStore,
] = createStore({
  show: false,
  layerName: undefined,
  variableName: undefined,
  series: undefined,
  classificationMethod: undefined,
  nClasses: undefined,
  colorScheme: undefined,
  invertColorScheme: undefined,
} as ClassificationPanelStoreType);

export {
  classificationPanelStore,
  setClassificationPanelStore,
};
