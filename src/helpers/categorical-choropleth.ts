import { getColors } from 'dicopal';

import { isNonNull } from './common';
import { randomColor } from './color';

import type { CategoricalChoroplethMapping, GeoJSONFeature } from '../global';

const selectDefaultColors = (n: number): string[] => {
  let colors;
  if (n <= 7) {
    // We use colors from the otake ito palette
    // which is safe for colorblind people but we skip the first color
    colors = getColors('Okabe_Ito_Categorigal', 8)!.toReversed().slice(0, n);
  } else if (n <= 12) {
    // We use colors from Set3 of colorbrewer
    colors = getColors('Set3', 12)!.toReversed().slice(0, n);
  } else if (n <= 20) {
    // We use colors from Tableau (but this is paired colors)
    colors = getColors('Tableau', 20)!.toReversed().slice(0, n);
  } else {
    // Return an array of random color
    colors = Array.from({ length: n }, randomColor);
  }
  return colors;
};

export const makeCategoriesMap = (
  features: GeoJSONFeature[],
  variable: string,
): Map<string | number | null, number> => {
  const m = new Map();
  features.forEach((f) => {
    const value = f.properties[variable];
    if (isNonNull(value)) m.set(value, (m.get(value) || 0) + 1);
    else m.set(null, (m.get(null) || 0) + 1);
  });
  return m;
};

export const makeCategoriesMapping = (
  categories: Map<string | number | null, number>,
  defaultNoDataColor: string = '#ffffff',
): CategoricalChoroplethMapping[] => {
  const hasNull = categories.has(null);
  const n = categories.size - (hasNull ? 1 : 0);
  const colors = selectDefaultColors(n);
  return Array.from(categories)
    .map((c, i) => ({
      value: c[0],
      categoryName: c[0] ? String(c[0]) : null,
      color: colors[i] || defaultNoDataColor,
      count: c[1],
    }))
    .sort((a, b) => a.categoryName - b.categoryName);
};
