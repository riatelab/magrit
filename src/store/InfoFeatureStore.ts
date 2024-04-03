import { createStore } from 'solid-js/store';

type InfoFeatureStoreType = {
  show: boolean,
  featureProperties: Record<string, any>,
};

const getEmptyInfoFeatureStore = () => ({
  show: false,
  featureProperties: {},
} as InfoFeatureStoreType);

const [
  infoFeatureStore,
  setInfoFeatureStore,
] = createStore(getEmptyInfoFeatureStore());

const resetInfoFeatureStore = () => setInfoFeatureStore(getEmptyInfoFeatureStore());

export {
  infoFeatureStore,
  setInfoFeatureStore,
  resetInfoFeatureStore,
};
