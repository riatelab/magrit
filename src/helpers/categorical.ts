// Imports from external libraries
import { getColors } from 'dicopal';
import type { Feature } from 'geojson';

// Helpers
import { randomColor } from './color';
import { isNonNull } from './common';
import sanitizeSVG from './sanitize-svg';

// Info from stores
import { applicationSettingsStore } from '../store/ApplicationSettingsStore';

// Picto images
import images from './symbol-library';

// Types
import type {
  CategoricalChoroplethMapping,
  CategoricalPictogramMapping,
} from '../global';

const selectDefaultColors = (n: number): string[] => {
  let colors;
  if (n <= 7) {
    // We use colors from the Okabe-Ito palette
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
  features: Feature[],
  variable: string,
): Map<string | number | null, number> => {
  const m = new Map();
  features.forEach((f) => {
    const value = f.properties![variable];
    if (isNonNull(value)) m.set(value, (m.get(value) || 0) + 1);
    else m.set(null, (m.get(null) || 0) + 1);
  });
  return m;
};

export const makeCategoriesMapping = (
  categories: Map<string | number | null, number>,
): CategoricalChoroplethMapping[] => {
  const hasNull = categories.has(null);
  const n = categories.size - (hasNull ? 1 : 0);
  const colors = selectDefaultColors(n);
  let j = 0;
  return Array.from(categories)
    .map((c, i) => ({
      value: isNonNull(c[0]) ? c[0] : null,
      categoryName: isNonNull(c[0]) ? String(c[0]) : 'No data',
      // eslint-disable-next-line no-plusplus
      color: isNonNull(c[0]) ? colors[j++] : applicationSettingsStore.defaultNoDataColor,
      count: c[1],
      show: true,
    }))
    .sort((a, b) => (a.categoryName || '').localeCompare(b.categoryName || ''));
};

export const makePictoCategoriesMapping = (
  categories: Map<string | number | null, number>,
): CategoricalPictogramMapping[] => Array.from(categories)
  .map((c, i) => ({
    value: isNonNull(c[0]) ? c[0] : null,
    categoryName: isNonNull(c[0]) ? String(c[0]) : null,
    count: c[1],
    iconType: 'SVG',
    iconContent: sanitizeSVG(images[i % images.length]),
    iconDimension: [50, 50],
    show: true,
  } as CategoricalPictogramMapping))
  .sort((a, b) => (a.categoryName || '').localeCompare(b.categoryName || ''));
