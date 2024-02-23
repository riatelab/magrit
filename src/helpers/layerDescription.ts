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
      hasCategorical: false,
      hasStock: false,
      hasRatio: false,
      hasIdentifier: false,
    };
  }

  const hasCategorical = layer.fields.some((f) => f.type === 'categorical');
  const hasStock = layer.fields.some((f) => f.type === 'stock');
  const hasRatio = layer.fields.some((f) => f.type === 'ratio');
  const hasIdentifier = layer.fields.some((f) => f.type === 'identifier');
  // const hasUnknown = layer.fields.some((f) => f.type === 'unknown');

  return {
    hasCategorical,
    hasStock,
    hasRatio,
    hasIdentifier,
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
