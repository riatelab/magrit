import { layersDescriptionStore } from '../store/LayersDescriptionStore';
import type { LayerDescription } from '../global';

const supportedLayerTypes = ['point', 'linestring', 'polygon'];
const isExportableLayer = (layerDescription: LayerDescription) => (
  layerDescription.data.type === 'FeatureCollection' && supportedLayerTypes.includes(layerDescription.type));

const isCandidateForRepresentation = (layerDescription: LayerDescription) => (
  layerDescription.data.type === 'FeatureCollection'
  && supportedLayerTypes.includes(layerDescription.type)
  && layerDescription.fields && layerDescription.fields.length > 0
);

function layerAvailableVariables(layerId: string) {
  const layer = layersDescriptionStore.layers
    .find((l) => l.id === layerId);

  if (!layer || !layer.fields) {
    return {
      nCategorical: 0,
      nStock: 0,
      nRatio: 0,
      nIdentifier: 0,
    };
  }

  const nCategorical = layer.fields.filter((f) => f.type === 'categorical').length;
  const nStock = layer.fields.filter((f) => f.type === 'stock').length;
  const nRatio = layer.fields.filter((f) => f.type === 'ratio').length;
  const nIdentifier = layer.fields.filter((f) => f.type === 'identifier').length;
  // const hasUnknown = layer.fields.some((f) => f.type === 'unknown');

  return {
    nCategorical,
    nStock,
    nRatio,
    nIdentifier,
    // hasUnknown,
  };
}

function layerGeometryType(layerId: string) {
  const layer = layersDescriptionStore.layers
    .find((l) => l.id === layerId);

  if (!layer) {
    return null;
  }

  return layer.type;
}

function layerAnyAvailableVariable(layerId: string) {
  const layer = layersDescriptionStore.layers
    .find((l) => l.id === layerId);

  if (!layer || !layer.fields) {
    return false;
  }

  return layer.fields.length > 0;
}

function getLayerName(layerIr: string) {
  const layer = layersDescriptionStore.layers
    .find((l) => l.id === layerIr);

  if (!layer) {
    return null;
  }

  return layer.name;
}

export {
  getLayerName,
  isExportableLayer,
  isCandidateForRepresentation,
  layerAvailableVariables,
  layerGeometryType,
  layerAnyAvailableVariable,
};
