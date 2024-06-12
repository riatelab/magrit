import { isFiniteNumber } from './common';

// The supported data types for the fields of a layer
export enum DataType {
  string = 'string',
  number = 'number',
  boolean = 'boolean',
  date = 'date',
}

// The supported ("cartographic") types for the fields of a layer
export enum VariableType {
  identifier = 'identifier',
  ratio = 'ratio',
  stock = 'stock',
  categorical = 'categorical',
  unknown = 'unknown',
}

export interface Variable {
  // The name of the described variable
  name: string,
  // Whether the variable has missing values or not
  hasMissingValues: boolean,
  // The type of the variable
  type: VariableType,
  // The data type of the variable
  dataType: DataType,
}

// Detect the types of a field:
// - its DataType
// - its VariableType
// - whether it has missing values
export function detectTypeField(
  values: never[],
  fieldName: string,
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
    } else if (isFiniteNumber(values[i])) {
      if (values[i].toString().trim().startsWith('0')) {
        if (values[i].toString().trim() === 0 || values[i].toString().trim().startsWith('0.')) {
          dt.push(DataType.number);
        } else {
          dt.push(DataType.string);
        }
      } else {
        dt.push(DataType.number);
      }
    } else if (typeof values[i] === 'boolean' || tf.includes(values[i])) {
      dt.push(DataType.boolean);
    } else {
      dt.push(DataType.string);
    }
  }

  const filteredValues = values.filter((v) => v !== null && v !== '' && v !== undefined);
  const filteredDatatypes = dt.filter((v) => v !== null);
  const hasMissingValues = filteredDatatypes.length !== dt.length;
  const hasDuplicates = filteredValues.length !== (new Set(filteredValues)).size;

  if (filteredDatatypes.every((d) => d === DataType.number)) {
    // All the (non-missing) values are of type 'number'
    dataType = DataType.number;

    if (filteredValues.every((v) => v === filteredValues[0])) {
      // If all the values are the exact same value, lets say for now
      // that this is a categorical variable, but with a single category
      // (such as the 'REGION' field in a dataset from which municipalities
      // of a single region have been extracted)
      variableType = VariableType.categorical;
    // We check if all the values are integers
    } else if (filteredValues.every((v) => Number.isInteger(+v))) {
      // We check if all the values are strictly different
      if (
        !hasDuplicates
        // filteredValues.every((v) => filteredValues.indexOf(v) === filteredValues.lastIndexOf(v))
      ) {
        // If all the values are strictly different (and if there is no missing value in the field),
        // we probably have an identifier... but this could be a stock or ratio too.
        variableType = hasMissingValues ? VariableType.stock : VariableType.identifier;
      } else if ((new Set(filteredValues)).size < (filteredValues.length / 3)) {
        // If there are less than (total values / 3) different values
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
    } else if (filteredValues.every((v) => v === filteredValues[0])) {
      // If all the values are the exact same value, lets say for now
      // that this is a categorical variable, but with a single category
      // (such as the 'REGION' field in a dataset from which municipalities
      // of a single region have been extracted)
      variableType = VariableType.categorical;
    } else {
      // ...otherwise this is probably a categorical variable
      variableType = VariableType.categorical;
    }
  } else if (
    !hasMissingValues
    && filteredDatatypes.every((d) => d === DataType.number || d === DataType.string)
    && !hasDuplicates
    // && filteredValues.every((v) => filteredValues.indexOf(v) === filteredValues.lastIndexOf(v))
  ) {
    // Here we have a mix of numbers and strings, no duplicates and no missing values
    // so it might be an identifier (for example France Department codes
    // are both number stored as string "01", "11", etc.
    // and regular strings "2A" and "2B")
    dataType = DataType.string; // We want to consider all the entries as string
    variableType = VariableType.identifier; // And it might be an identifier
  } else {
    dataType = DataType.string;
    variableType = VariableType.unknown;
  }

  // Perform some extra-checks to correct the variable type...
  // - If we have no missing value, no duplicate and all the values are integers,
  //   it could be an identifier or a stock.. so if the field name contains "population",
  //   we will consider it as a stock
  if (
    dataType === DataType.number
    && variableType === VariableType.identifier
    && (
      fieldName.toLowerCase().startsWith('pop')
      || fieldName.toLowerCase().endsWith('pop')
    )
  ) {
    variableType = VariableType.stock;
  }
  // - If we have no missing value and all the values are numbers, and the field name contains
  //   a reference to the surface / an area, we can probably consider this as a stock*
  //   (even if the values are not integers)
  if (
    dataType === DataType.number
    && !hasMissingValues
    && (
      fieldName.toLowerCase().includes('area')
      || fieldName.toLowerCase().includes('surface')
    )
  ) {
    variableType = VariableType.stock;
  }
  // - If we have no missing value and no duplicate and we still haven't found a variable type,
  //   we can probably consider this as an identifier
  if (
    !hasDuplicates
    && !hasMissingValues
    && variableType === VariableType.unknown
  ) {
    variableType = VariableType.identifier;
  }

  return {
    dataType,
    variableType,
    hasMissingValues,
  };
}
