import { DataTypes, VariableTypes } from '../global.d';
import { isNumber } from './common';

export function noOp() { }

// Detect the types of a field:
// - its DataType
// - its VariableType
export function detectTypeField(
  values: any[],
): { dataType: DataTypes, variableType: VariableTypes, hasMissingValues: boolean } {
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
  let dataType: DataTypes = DataTypes.string;
  let variableType: VariableTypes = VariableTypes.unknown;
  const tf = ['true', 'false'];
  const dt = [];

  // eslint-disable-next-line no-plusplus
  for (let i = 0, l = values.length; i < l; i++) {
    if (values[i] === null || values[i] === '' || values[i] === undefined) {
      dt.push(null);
    } else if (isNumber(values[i])) {
      dt.push(DataTypes.number);
    } else if (typeof values[i] === 'boolean' || tf.includes(values[i])) {
      dt.push(DataTypes.boolean);
    } else {
      dt.push(DataTypes.string);
    }
  }

  const filteredValues = dt.filter((v) => v !== null);
  const hasMissingValues = filteredValues.length !== dt.length;

  if (filteredValues.every((d) => d === DataTypes.number)) {
    dataType = DataTypes.number;
    if (values.every((v) => Number.isInteger(v))) {
      if (values.every((v) => values.indexOf(v) === values.lastIndexOf(v))) {
        variableType = VariableTypes.identifier;
      } else {
        variableType = VariableTypes.stock;
      }
    } else {
      variableType = VariableTypes.ratio;
    }
  } else if (filteredValues.every((d) => d === DataTypes.boolean)) {
    dataType = DataTypes.boolean;
    variableType = VariableTypes.categorical;
  } else if (filteredValues.every((d) => d === DataTypes.string)) {
    dataType = DataTypes.string;
    if (values.every((v) => values.indexOf(v) === values.lastIndexOf(v))) {
      variableType = VariableTypes.identifier;
    } else {
      variableType = VariableTypes.categorical;
    }
  } else {
    dataType = DataTypes.string;
    variableType = VariableTypes.unknown;
  }

  return {
    dataType,
    variableType,
    hasMissingValues,
  };
}
