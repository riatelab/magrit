import {
  type JSX,
} from 'solid-js';

/**
 * Component for selecting the links to display.
 * Several selection options are available:
 * - By Origin + Destination
 * - By Origin
 * - By Destination
 * - By the value of the intensity variable
 * - By the value of the distance variable
 * - By the value of another variable (that may contain temporal or categorical information)
 * - By the combination of the previous options
 *
 */
function linksSelection(): JSX.Element {
  return <></>;
}

/**
 * Component for classifying the links to display.
 * All the classification methods available in the application are available.
 * The user can choose the classification method, the number of classes
 * and the corresponding link width for each class.
 *
 */
function linksClassification(): JSX.Element {
  return <></>;
}

export {
  linksClassification,
  linksSelection,
};
