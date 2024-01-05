import { createStore } from 'solid-js/store';
import { makeDefaultGraticule, makeDefaultSphere, makeDefaultWorldLand } from '../helpers/layers';
import { unproxify } from '../helpers/common';
import type { LayerDescription, LayoutFeature, TableDescription } from '../global';
import { debouncedPushUndoStack, resetRedoStackStore } from './stateStackStore';

export type LayersDescriptionStoreType = {
  layers: LayerDescription[],
  layoutFeatures: LayoutFeature[],
  tables: TableDescription[],
};

const defaultLayersDescription = (): LayersDescriptionStoreType => ({
  layers: [
    makeDefaultSphere(),
    makeDefaultWorldLand(),
    makeDefaultGraticule(),
  ],
  layoutFeatures: [],
  tables: [],
});

const [
  layersDescriptionStore,
  setLayersDescriptionStoreBase,
] = createStore(defaultLayersDescription());

/**
 * This is a wrapper around the setLayersDescriptionStoreBase function.
 * The wrapper is used to push the current state to the undo stack
 * before actually updating the store.
 */
const setLayersDescriptionStore = (...args: any[]) => {
  // Push the current state to the (undo) state stack
  debouncedPushUndoStack('layersDescription', unproxify(layersDescriptionStore as never));
  // Reset the redo stack
  resetRedoStackStore();
  // Apply the changes to the store
  setLayersDescriptionStoreBase(...args);
};

export {
  layersDescriptionStore,
  setLayersDescriptionStore,
  defaultLayersDescription,
  setLayersDescriptionStoreBase,
};
