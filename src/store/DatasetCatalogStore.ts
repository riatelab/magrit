import { createStore } from 'solid-js/store';

type DatasetCatalogStoreType = {
  show: boolean,
};

const [
  datasetCatalogStore,
  setDatasetCatalogStore,
] = createStore({
  show: false,
} as DatasetCatalogStoreType);

export {
  datasetCatalogStore,
  setDatasetCatalogStore,
};
