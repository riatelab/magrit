import { describe, it, expect } from 'vitest';
import { DataType, VariableType, detectTypeField } from './typeDetection';

describe('detectTypeField', () => {
  it('should detect numbers with strictly different values as identifiers', () => {
    const values = [1, 2, 3, 4, 5];
    const result = detectTypeField(values, 'id');
    expect(result).toEqual({
      dataType: DataType.number,
      variableType: VariableType.identifier,
      hasMissingValues: false,
    });
  });

  // it('should detect numbers with duplicates as categorical', () => {
  //   const values = [1, 2, 2, 3, 3, 3];
  //   const result = detectTypeField(values, 'category');
  //   expect(result).toEqual({
  //     dataType: DataType.number,
  //     variableType: VariableType.categorical,
  //     hasMissingValues: false,
  //   });
  // });

  it('should detect mixed types with missing values', () => {
    const values = [1, 'string', null, 4];
    const result = detectTypeField(values, 'mixedField');
    expect(result).toEqual({
      dataType: DataType.string,
      variableType: VariableType.unknown,
      hasMissingValues: true,
    });
  });

  it('should detect booleans as categorical', () => {
    const values = [true, false, true, false];
    const result = detectTypeField(values, 'booleanField');
    expect(result).toEqual({
      dataType: DataType.boolean,
      variableType: VariableType.categorical,
      hasMissingValues: false,
    });
  });

  it('should detect integers as stock when field name suggests population', () => {
    const values = [100, 200, 300];
    const result = detectTypeField(values, 'population_count');
    expect(result).toEqual({
      dataType: DataType.number,
      variableType: VariableType.stock,
      hasMissingValues: false,
    });
  });

  it('should detect strings with all unique values as identifiers', () => {
    const values = ['a', 'b', 'c'];
    const result = detectTypeField(values, 'uniqueStrings');
    expect(result).toEqual({
      dataType: DataType.string,
      variableType: VariableType.identifier,
      hasMissingValues: false,
    });
  });

  it('should detect numbers with all the same values as categorical', () => {
    const values = [1, 1, 1, 1];
    const result = detectTypeField(values, 'constantNumber');
    expect(result).toEqual({
      dataType: DataType.number,
      variableType: VariableType.categorical,
      hasMissingValues: false,
    });
  });

  it('should detect strings as categorical when there are duplicates', () => {
    const values = ['a', 'b', 'b', 'c'];
    const result = detectTypeField(values, 'stringField');
    expect(result).toEqual({
      dataType: DataType.string,
      variableType: VariableType.categorical,
      hasMissingValues: false,
    });
  });

  it('should detect missing values correctly', () => {
    const values = ['a', 'b', 'c', 'd', 'e', '', null, undefined];
    const result = detectTypeField(values, 'fieldWithMissingValues');
    expect(result).toEqual({
      dataType: DataType.string,
      variableType: VariableType.identifier,
      hasMissingValues: true,
    });
  });
});
