import { describe, it, expect } from 'vitest';
import { mergeBboxes } from './geo';

describe('mergeBboxes', () => {
  it('should return the same bbox when given a single bbox', () => {
    const bboxes: [number, number, number, number][] = [
      [0, 0, 10, 10],
    ];
    const result = mergeBboxes(bboxes);
    expect(result).toEqual([0, 0, 10, 10]);
  });

  it('should merge multiple bboxes correctly', () => {
    const bboxes: [number, number, number, number][] = [
      [0, 0, 10, 10],
      [5, 5, 15, 15],
      [-5, -5, 5, 5],
    ];
    const result = mergeBboxes(bboxes);
    expect(result).toEqual([-5, -5, 15, 15]);
  });

  it('should handle bboxes with negative coordinates', () => {
    const bboxes: [number, number, number, number][] = [
      [-10, -10, 0, 0],
      [-5, -15, 5, 5],
    ];
    const result = mergeBboxes(bboxes);
    expect(result).toEqual([-10, -15, 5, 5]);
  });

  it('should handle an empty list of bboxes gracefully', () => {
    const bboxes: [number, number, number, number][] = [];
    expect(mergeBboxes(bboxes)).toEqual([Infinity, Infinity, -Infinity, -Infinity]);
  });
});
