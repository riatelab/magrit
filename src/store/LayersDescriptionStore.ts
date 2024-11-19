import { createStore } from 'solid-js/store';

// Helpers
import { makeDefaultGraticule, makeDefaultSphere, makeDefaultWorldLand } from '../helpers/layers';
import { debounce, unproxify } from '../helpers/common';

// Stores
import { applicationSettingsStore } from './ApplicationSettingsStore';
import { debouncedPushUndoStack, resetRedoStackStore } from './stateStackStore';

// Types
import type {
  LayerDescription,
  LayoutFeature,
  Legend,
  TableDescription,
} from '../global';

export type LayersDescriptionStoreType = {
  layers: LayerDescription[],
  layoutFeaturesAndLegends: Array<LayoutFeature | Legend>,
  tables: TableDescription[],
};

const defaultLayersDescription = (): LayersDescriptionStoreType => ({
  layers: [
    makeDefaultSphere(),
    makeDefaultWorldLand(),
    makeDefaultGraticule(),
  ],
  layoutFeaturesAndLegends: [],
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
  if (applicationSettingsStore.useUndoRedo) {
    // Push the current state to the (undo) state stack
    debouncedPushUndoStack('layersDescription', unproxify(layersDescriptionStore));
    // Reset the redo stack
    resetRedoStackStore();
  }
  // Apply the changes to the store
  setLayersDescriptionStoreBase(...args);
};

/**
 * Update a property of a layer in the store.
 *
 * @param layerId
 * @param propOrProps
 * @param value
 */
const updateProp = (
  layerId: string,
  propOrProps: string | string[],
  value: string | number | boolean | object | null,
) => {
  if (Array.isArray(propOrProps)) {
    const allPropsExceptLast = propOrProps.slice(0, propOrProps.length - 1);
    const lastProp = propOrProps[propOrProps.length - 1];
    const args = [
      'layers',
      (l: LayerDescription) => l.id === layerId,
      ...allPropsExceptLast,
      {
        [lastProp]: value,
      },
    ];
    // @ts-expect-error because we use a spread argument
    setLayersDescriptionStoreBase(...args);
  } else {
    setLayersDescriptionStoreBase(
      'layers',
      (l: LayerDescription) => l.id === layerId,
      { [propOrProps]: value },
    );
  }
};

/**
 * Debounced version of the updateProp function.
 */
const debouncedUpdateProp = debounce(updateProp, 200);

export {
  layersDescriptionStore,
  setLayersDescriptionStore,
  defaultLayersDescription,
  setLayersDescriptionStoreBase,
  updateProp,
  debouncedUpdateProp,
};
