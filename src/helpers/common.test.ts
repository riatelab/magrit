import { expect, test } from 'vitest';
import {
  camelToFlat, findSuitableName,
  getNumberOfDecimals, getUniqueValues,
  isEqual, isLessThan, isGreaterThan,
  isLessThanOrEqual, isGreaterThanOrEqual,
  isFiniteNumber, isNonNull,
  removeDiacritics,
} from './common';

test('isFiniteNumber', () => {
  expect(isFiniteNumber(1)).toBe(true);
  expect(isFiniteNumber(1.12)).toBe(true);
  expect(isFiniteNumber('1')).toBe(true);
  expect(isFiniteNumber('1.12')).toBe(true);
  expect(isFiniteNumber('')).toBe(false);
  expect(isFiniteNumber(null)).toBe(false);
  expect(isFiniteNumber(undefined)).toBe(false);
  expect(isFiniteNumber(true)).toBe(false);
  expect(isFiniteNumber(false)).toBe(false);
  expect(isFiniteNumber(NaN)).toBe(false);
  expect(isFiniteNumber(Infinity)).toBe(false);
  expect(isFiniteNumber(-Infinity)).toBe(false);
  expect(isFiniteNumber('a')).toBe(false);
  // expect(isFiniteNumber([])).toBe(false);
  // expect(isFiniteNumber({})).toBe(false);
});

test('isNonNull', () => {
  expect(isNonNull(1)).toBe(true);
  expect(isNonNull(1.12)).toBe(true);
  expect(isNonNull('1')).toBe(true);
  expect(isNonNull('1.12')).toBe(true);
  expect(isNonNull('')).toBe(false);
  expect(isNonNull(null)).toBe(false);
  expect(isNonNull(undefined)).toBe(false);
  expect(isNonNull(true)).toBe(true);
  expect(isNonNull(false)).toBe(true);
  expect(isNonNull(NaN)).toBe(true);
  expect(isNonNull(Infinity)).toBe(true);
  expect(isNonNull(-Infinity)).toBe(true);
});

test('getNumberOfDecimals', () => {
  expect(getNumberOfDecimals(1)).toBe(0);
  expect(getNumberOfDecimals(1.12)).toBe(2);
  expect(getNumberOfDecimals(1.123456)).toBe(6);
  expect(getNumberOfDecimals(0.000789)).toBe(6);
});

test('camelToFlat', () => {
  expect(camelToFlat('camelCase')).toBe('Camel Case');
  expect(camelToFlat('camelCaseTest')).toBe('Camel Case Test');
  expect(camelToFlat('CamelCasE')).toBe('Camel Cas E');
  expect(camelToFlat('NaturalEarth2')).toBe('Natural Earth 2');
  expect(camelToFlat('Kavrayskiy7')).toBe('Kavrayskiy 7');
});

test('getUniqueValues', () => {
  expect(getUniqueValues([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  expect(getUniqueValues(
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  )).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

test('findSuitableName', () => {
  expect(findSuitableName('name', ['name', 'other name'])).toBe('name (1)');
  expect(findSuitableName('name', ['name', 'other name', 'name (1)'])).toBe('name (2)');
  expect(findSuitableName('name', ['name', 'other name', 'name (1)', 'name (2)'])).toBe('name (3)');
  expect(findSuitableName('name', ['name', 'other name', 'name (1)', 'name (3)'])).toBe('name (2)');
  expect(findSuitableName('name', ['name (1)', 'name (2)', 'name (3)'])).toBe('name (4)');
});

test('removeDiaCritics', () => {
  expect(removeDiacritics('ÉÀÈÇÙ')).toBe('EAECU');
  expect(removeDiacritics('éàèçù')).toBe('eaecu');
  expect(removeDiacritics('Île-de-France')).toBe('Ile-de-France');
  expect(removeDiacritics('île-Île~ô_ö~ ìçé'), 'ile-Ile~o_o~ ice');
});

test('isEqual', () => {
  expect(isEqual(1, 1, 1)).toBe(true);
  expect(isEqual(1, 1.0000000001, 6)).toBe(true);
  expect(isEqual(1, 1.0000000001, 10)).toBe(false);
  expect(isEqual(6.5428, 6.5427763, 4)).toBe(true);
  expect(isEqual(6.5428, 6.5427763, 5)).toBe(false);
});

test('isLessThan', () => {
  expect(isLessThan(1, 2, 1)).toBe(true);
  expect(isLessThan(1, 1.0000000001, 6)).toBe(false);
  expect(isLessThan(1, 1.0000000001, 10)).toBe(true);
  expect(isLessThan(6.5428, 6.5427763, 4)).toBe(false);
  expect(isLessThan(6.5428, 6.5427763, 5)).toBe(false);
});

test('isGreaterThan', () => {
  expect(isGreaterThan(1, 2, 1)).toBe(false);
  expect(isGreaterThan(1, 1.0000000001, 6)).toBe(false);
  expect(isGreaterThan(1, 1.0000000001, 10)).toBe(false);
  expect(isGreaterThan(6.5428, 6.5427763, 4)).toBe(false);
  expect(isGreaterThan(6.5428, 6.5427763, 5)).toBe(true);
});

test('isLessThanOrEqual', () => {
  expect(isLessThanOrEqual(1, 2, 1)).toBe(true);
  expect(isLessThanOrEqual(1, 1.0000000001, 6)).toBe(true);
  expect(isLessThanOrEqual(1, 1.0000000001, 10)).toBe(true);
  expect(isLessThanOrEqual(6.5428, 6.5427763, 4)).toBe(true);
  expect(isLessThanOrEqual(6.5428, 6.5427763, 5)).toBe(false);
});

test('isGreaterThanOrEqual', () => {
  expect(isGreaterThanOrEqual(1, 2, 1)).toBe(false);
  expect(isGreaterThanOrEqual(1, 1.0000000001, 6)).toBe(true);
  expect(isGreaterThanOrEqual(1, 1.0000000001, 10)).toBe(false);
  expect(isGreaterThanOrEqual(6.5428, 6.5427763, 4)).toBe(true);
  expect(isGreaterThanOrEqual(6.5428, 6.5427763, 5)).toBe(true);
});
