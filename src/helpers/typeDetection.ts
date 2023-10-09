import { DataType, VariableType } from '../global.d';
import { isNumber } from './common';

// Detect the types of a field:
// - its DataType
// - its VariableType
// - whether it has missing values
export default function detectTypeField(
  values: never[],
): { dataType: DataType, variableType: VariableType, hasMissingValues: boolean } {
  // We will loop through the values of the field and try to detect the type of the field
  // We will use the following rules:
  // - if all values are numbers (or can be converted to number), the field has datatype 'number'
  //   - if all values are integers and strictly different, the field has variable type 'identifier'
  //   - if all values are integers and not strictly different, the field has variable type 'stock'
  //   - if all values are floats, the field has variable type 'ratio'
  // - if all values are booleans, the field has datatype 'boolean' and variable type 'categorical'
  // - if all values are strings, the field has datatype 'string'
  //   - if all values are different, the field has variable type 'identifier'
  //   - if all values are not different, the field has variable type 'categorical'

  // An array with all the data types found for the given variable
  const dt = [];
  // Boolean type, as strings
  const tf = ['true', 'false'];
  // Result of the type detection
  let dataType: DataType;
  let variableType: VariableType;

  // eslint-disable-next-line no-plusplus
  for (let i = 0, l = values.length; i < l; i++) {
    if (values[i] === null || values[i] === '' || values[i] === undefined) {
      dt.push(null);
    } else if (isNumber(values[i])) {
      dt.push(DataType.number);
    } else if (typeof values[i] === 'boolean' || tf.includes(values[i])) {
      dt.push(DataType.boolean);
    } else {
      dt.push(DataType.string);
    }
  }

  const filteredValues = values.filter((v) => v !== null);
  const filteredDatatypes = dt.filter((v) => v !== null);
  const hasMissingValues = filteredDatatypes.length !== dt.length;

  if (filteredDatatypes.every((d) => d === DataType.number)) {
    // All the (non-missing) values are of type 'number'
    dataType = DataType.number;

    if (filteredValues.every((v) => v === filteredValues[0])) {
      // If all the values are the exact same value, lets say for now
      // that this is an unknown variable
      variableType = VariableType.unknown;
    // We check if all the values are integers
    } else if (filteredValues.every((v) => Number.isInteger(v))) {
      // We check if all the values are strictly different
      if (
        filteredValues.every((v) => filteredValues.indexOf(v) === filteredValues.lastIndexOf(v))
      ) {
        // If all the values are strictly different (and if there is no missing value in the field),
        // we probably have an identifier... but this could be a stock or ratio too.
        variableType = hasMissingValues ? VariableType.stock : VariableType.identifier;
      } else if (filteredValues.length > 15 && (new Set(filteredValues)).size < 10) {
        // If there are less than 10 different values
        // (and more than 15 values in total),
        // we consider this variable as categorical
        variableType = VariableType.categorical;
      } else {
        // If all the (non-missing) values are not strictly different, we may have a stock
        variableType = VariableType.stock;
      }
    } else { // All the values are not integers
      // All the values are numbers, all the numbers are not the same,
      // they are not all integers.. so might be a ratio
      variableType = VariableType.ratio;
    }
  } else if (filteredDatatypes.every((d) => d === DataType.boolean)) {
    // All the (non-missing) values are of type 'boolean'...
    dataType = DataType.boolean;
    // ... so we consider this field as categorical
    variableType = VariableType.categorical;
  } else if (filteredDatatypes.every((d) => d === DataType.string)) {
    // All the (non-missing) values are of type 'string'
    dataType = DataType.string;
    if (values.every((v) => values.indexOf(v) === values.lastIndexOf(v))) {
      // If all the values are strictly different, we probably have an identifier...
      variableType = VariableType.identifier;
    } else {
      // ...otherwise this is probably a categorical variable
      variableType = VariableType.categorical;
    }
  } else {
    dataType = DataType.string;
    variableType = VariableType.unknown;
  }

  return {
    dataType,
    variableType,
    hasMissingValues,
  };
}
