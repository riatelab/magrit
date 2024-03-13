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

function layerAvailableVariables(layer: LayerDescription) {
  if (!layer.fields) {
    return {
      nCategorical: 0,
      nStock: 0,
      nRatio: 0,
      nIdentifier: 0,
      nUnknown: 0,
    };
  }

  return {
    nCategorical: layer.fields.filter((f) => f.type === 'categorical').length,
    nStock: layer.fields.filter((f) => f.type === 'stock').length,
    nRatio: layer.fields.filter((f) => f.type === 'ratio').length,
    nIdentifier: layer.fields.filter((f) => f.type === 'identifier').length,
    nUnknown: layer.fields.filter((f) => f.type === 'unknown').length,
  };
}

function layerGeometryType(layer: LayerDescription) {
  return layer.type;
}

function layerAnyAvailableVariable(layer: LayerDescription) {
  if (!layer.fields) {
    return false;
  }

  return layer.fields.length > 0;
}

function layerName(layer: LayerDescription) {
  return layer.name;
}

function summaryForChoosingPortrayal(layerId: string) {
  const layer = layersDescriptionStore.layers
    .find((l) => l.id === layerId)!;

  const hasAnyVariable = layerAnyAvailableVariable(layer);
  const availableVariables = layerAvailableVariables(layer);
  const geomType = layerGeometryType(layer);
  const nFeatures = layer.data.features.length;

  return {
    availableVariables,
    geomType,
    hasAnyVariable,
    name: layerName(layer),
    nFeatures,
  };
}

export {
  summaryForChoosingPortrayal,
  isExportableLayer,
  isCandidateForRepresentation,
  layerAnyAvailableVariable,
  layerAvailableVariables,
  layerGeometryType,
  layerName,
};
