import { DataType, VariableType } from '../global.d';
import { isNumber } from './common';

export function noOp() { }

// Detect the types of a field:
// - its DataType
// - its VariableType
export function detectTypeField(
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

  // We will use the following variables to store the results of the detection
  let dataType: DataType = DataType.string;
  let variableType: VariableType = VariableType.unknown;
  const tf = ['true', 'false'];
  const dt = [];

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

  const filteredValues = dt.filter((v) => v !== null);
  const hasMissingValues = filteredValues.length !== dt.length;

  if (filteredValues.every((d) => d === DataType.number)) {
    dataType = DataType.number;
    if (values.every((v) => Number.isInteger(v))) {
      if (values.every((v) => values.indexOf(v) === values.lastIndexOf(v))) {
        variableType = VariableType.identifier;
      } else {
        variableType = VariableType.stock;
      }
    } else {
      variableType = VariableType.ratio;
    }
  } else if (filteredValues.every((d) => d === DataType.boolean)) {
    dataType = DataType.boolean;
    variableType = VariableType.categorical;
  } else if (filteredValues.every((d) => d === DataType.string)) {
    dataType = DataType.string;
    if (values.every((v) => values.indexOf(v) === values.lastIndexOf(v))) {
      variableType = VariableType.identifier;
    } else {
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
