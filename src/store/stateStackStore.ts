import { createStore, produce } from 'solid-js/store';
import { debounce } from '../helpers/common';

export type StateStackStoreType = {
  redoStack: { type: 'mapStore' | 'layersDescription', data: unknown }[],
  undoStack: { type: 'mapStore' | 'layersDescription', data: unknown }[],
};

const [
  stateStackStore,
  setStateStackStore,
] = createStore({
  redoStack: [],
  undoStack: [],
} as StateStackStoreType);

/**
 * Push a state to the undo stack. Note that we only keep the last 20 states.
 * This is used to implement the undo/redo feature (specifically the undo part).
 *
 * @param {'mapStore' | 'layersDescription'} type - The type of the state to push.
 * @param {object} data - The state to push.
 * @return {void}
 */
const pushUndoStackStore = (type: 'mapStore' | 'layersDescription', data: object): void => {
  setStateStackStore(
    produce((draft: StateStackStoreType) => {
      draft.undoStack.push({ type, data });
      if (draft.undoStack.length > 20) {
        draft.undoStack.shift();
      }
    }),
  );
};

/**
 * Push a state to the redo stack. Note that we only keep the last 20 states.
 * This is used to implement the undo/redo feature (specifically the redo part).
 *
 * @param {'mapStore' | 'layersDescription'} type - The type of the state to push.
 * @param {object} data - The state to push.
 * @return {void}
 */
const pushRedoStackStore = (type: 'mapStore' | 'layersDescription', data: object): void => {
  setStateStackStore(
    produce((draft: StateStackStoreType) => {
      draft.redoStack.push({ type, data });
      if (draft.redoStack.length > 20) {
        draft.redoStack.shift();
      }
    }),
  );
};

/**
 * Reset the redo stack to an empty array.
 *
 * @return {void}
 */
const resetRedoStackStore = (): void => {
  setStateStackStore(
    produce((draft: StateStackStoreType) => {
      // eslint-disable-next-line no-param-reassign
      draft.redoStack = [];
    }),
  );
};

/**
 * Reset the undo stack, and the redo stack to empty arrays.
 */
const resetUndoRedoStackStore = () => {
  setStateStackStore(
    produce((draft: StateStackStoreType) => {
      // eslint-disable-next-line no-param-reassign
      draft.redoStack = [];
      // eslint-disable-next-line no-param-reassign
      draft.undoStack = [];
    }),
  );
};

/**
 * Reset the undo stack to an empty array.
 *
 * @return {void}
 */
const resetUndoStackStore = (): void => {
  setStateStackStore(
    produce((draft: StateStackStoreType) => {
      // eslint-disable-next-line no-param-reassign
      draft.undoStack = [];
    }),
  );
};

/**
 * This is a wrapper around the pushUndoStackStore function.
 * The call to pushUndoStackStore is debounced to avoid pushing
 * too many (probably intermediate) states to the undo stack.
 */
const debouncedPushUndoStack = debounce(pushUndoStackStore, 500, true);

export {
  stateStackStore,
  setStateStackStore,
  debouncedPushUndoStack,
  pushRedoStackStore,
  pushUndoStackStore,
  resetRedoStackStore,
  resetUndoStackStore,
  resetUndoRedoStackStore,
};
