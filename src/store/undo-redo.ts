// Imports from solid-js
import { produce } from 'solid-js/store';

// Helpers
import { unproxify } from '../helpers/common';

// Stores
import {
  mapStore,
  MapStoreType,
  setMapStoreBase,
} from './MapStore';
import {
  layersDescriptionStore,
  LayersDescriptionStoreType,
  setLayersDescriptionStoreBase,
} from './LayersDescriptionStore';
import {
  pushRedoStackStore,
  pushUndoStackStore,
  setStateStackStore,
  stateStackStore,
  StateStackStoreType,
} from './stateStackStore';

export function undo() {
  if (stateStackStore.undoStack.length > 0) {
    // Remove the last state from the undo stack
    const lastState = stateStackStore.undoStack[stateStackStore.undoStack.length - 1];
    setStateStackStore(
      produce((draft: StateStackStoreType) => {
        draft.undoStack.pop();
      }),
    );
    // We are storing the state from the mapStore and from the layersDescriptionStore
    // in the stack, so we need to check the type of the state
    if (lastState.type === 'mapStore') {
      // We push the current state to the redo stack
      pushRedoStackStore('mapStore', unproxify(mapStore));
      // We set the map from the last state
      // (we use setMapStoreBase instead of setMapStore
      // to avoid pushing the state to the undo stack)
      setMapStoreBase(lastState.data as MapStoreType);
    } else if (lastState.type === 'layersDescription') {
      // We push the current state to the redo stack
      pushRedoStackStore('layersDescription', unproxify(layersDescriptionStore));
      // We set the layers from the last state
      // (we use setLayersDescriptionStoreBase instead of setMapStore
      // to avoid pushing the state to the undo stack)
      setLayersDescriptionStoreBase(lastState.data as LayersDescriptionStoreType);
    }
  }
  return null;
}

export function redo() {
  if (stateStackStore.redoStack.length > 0) {
    // Remove the last state from the redo stack
    const lastState = stateStackStore.redoStack[stateStackStore.redoStack.length - 1];
    setStateStackStore(
      produce((draft: StateStackStoreType) => {
        draft.redoStack.pop();
      }),
    );
    // We are storing the state from the mapStore and from the layersDescriptionStore
    // in the stack, so we need to check the type of the state
    if (lastState.type === 'mapStore') {
      // We push the current state to the redo stack
      pushUndoStackStore('mapStore', unproxify(mapStore));
      // (we use setMapStoreBase instead of setMapStore
      // to avoid pushing the state to the undo stack)
      setMapStoreBase(lastState.data as MapStoreType);
    } else if (lastState.type === 'layersDescription') {
      // We push the current state to the redo stack
      pushUndoStackStore('layersDescription', unproxify(layersDescriptionStore));
      // (we use setLayersDescriptionStoreBase instead of setMapStore
      // to avoid pushing the state to the undo stack)
      setLayersDescriptionStoreBase(lastState.data as LayersDescriptionStoreType);
    }
  }
  return null;
}
