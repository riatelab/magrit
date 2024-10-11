import { describe, it, expect } from 'vitest';
import { autoTypeDataset } from './formatConversion';

describe('autoTypeDataset', () => {
  it('should transforms stringified numbers to numbers', () => {
    const ds = [
      { id: '1', name: 'a', value: '10' },
      { id: '2', name: 'b', value: '20' },
      { id: '3', name: 'c', value: '30' },
      { id: '4', name: 'd', value: '40' },
      { id: '5', name: 'e', value: '50' },
      { id: '6', name: 'f', value: '70' },
    ];
    ds.columns = ['id', 'name', 'value'];
    const result = autoTypeDataset(ds);
    const values = result.map((d) => d.value);
    expect(values).toEqual([10, 20, 30, 40, 50, 70]);
  });

  it('should transforms stringified numbers with NA to numbers with null', () => {
    const ds = [
      { id: '1', name: 'a', value: '10' },
      { id: '2', name: 'b', value: '20' },
      { id: '3', name: 'c', value: '30' },
      { id: '4', name: 'd', value: 'NA' },
      { id: '5', name: 'e', value: '50' },
      { id: '6', name: 'f', value: 'NA' },
    ];
    ds.columns = ['id', 'name', 'value'];
    const result = autoTypeDataset(ds);
    const values = result.map((d) => d.value);
    expect(values).toEqual([10, 20, 30, null, 50, null]);
  });

  it('should transforms stringified numbers with NA to numbers with null, even when there is one or more zero values (bug 143)', () => {
    const ds = [
      { id: '1', name: 'a', value: '0' },
      { id: '2', name: 'b', value: '20' },
      { id: '3', name: 'c', value: '30' },
      { id: '4', name: 'd', value: 'NA' },
      { id: '5', name: 'e', value: '0' },
      { id: '6', name: 'f', value: 'NA' },
    ];
    ds.columns = ['id', 'name', 'value'];
    const result = autoTypeDataset(ds);
    const values = result.map((d) => d.value);
    expect(values).toEqual([0, 20, 30, null, 0, null]);
  });

  it('should not transform numbers that start by 0 to number as they may be identifiers', () => {
    const ds = [
      { id: '01001', name: 'a', value: '10' },
      { id: '01002', name: 'b', value: '20' },
      { id: '01003', name: 'c', value: '30' },
      { id: '01004', name: 'd', value: '40' },
      { id: '01005', name: 'e', value: '50' },
      { id: '01006', name: 'f', value: '70' },
    ];
    ds.columns = ['id', 'name', 'value'];
    const result = autoTypeDataset(ds);
    const values = result.map((d) => d.id);
    expect(values).toEqual(['01001', '01002', '01003', '01004', '01005', '01006']);
  });
});
