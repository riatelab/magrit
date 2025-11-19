import { Accessor, Setter } from 'solid-js';
import {
  AnalysisOperationType,
  ProcessingOperationType,
  RepresentationType,
  TableOperationType,
} from '../../global';

export interface FunctionalityDescription {
  name: string;
  type: RepresentationType | ProcessingOperationType | AnalysisOperationType;
  enabled: boolean;
  allowedGeometryType?: 'point' | 'linestring' | 'polygon';
}

export interface TableFunctionalityDescription {
  name: string;
  type: TableOperationType;
  enabled: boolean;
}

type AccessorFuncDesc = Accessor<(TableFunctionalityDescription | FunctionalityDescription) | null>;
type SetterFuncDesc = Setter<(TableFunctionalityDescription | FunctionalityDescription) | null>;
type ListenerEscKey = (event: KeyboardEvent) => void;

/**
 * Creates a listener for the Escape key to handle modal closing or functionality deselection
 * (both in TableFunctionalitySelection and FunctionalitySelection modals).
 *
 * @param {HTMLElement} refParentNode - The parent HTML element containing the modal
 * @param {AccessorFuncDesc} selectedFunctionality - Accessor for the current selected functionality
 * @param {SetterFuncDesc} setSelectedFunctionality - Setter for updating the selected functionality
 * @returns {(event: KeyboardEvent) => void} - The event listener function for the Escape key
 */
export const makeListenerEscKey = (
  refParentNode: HTMLElement,
  selectedFunctionality: AccessorFuncDesc,
  setSelectedFunctionality: SetterFuncDesc,
): ListenerEscKey => (event: KeyboardEvent) => {
  // Check if the pressed key is Escape
  const isEscape = event.key
    ? (event.key === 'Escape' || event.key === 'Esc')
    : (event.keyCode === 27);

  if (isEscape) {
    // We want a different behavior if a functionality is selected or not
    if (selectedFunctionality()) {
      // Reset selected functionality so we go back to the list of functionality types
      setSelectedFunctionality(null);
    } else {
      // Close the modal
      (refParentNode.querySelector('.cancel-button') as HTMLElement).click();
    }
  }
};
