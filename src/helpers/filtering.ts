import type { Feature } from 'geojson';
import type { Filter } from '../global';

/**
 * Apply filters to a GeoJSON layer, and return the filtered layer.
 *
 * @param {Feature[]} features - The features to be filtered
 * @param {Filter} filters - The filters to apply to the layer
 */
function applyFilters(
  features: Feature[],
  filters: Filter[],
): Feature[] {
  return features.filter((feature) => filters.every((filter) => {
    const value = feature.properties[filter.variable];
    if (value === undefined || value === null) return false;
    switch (filter.operator) {
      case '==':
        return value === filter.value;
      case '!=':
        return value !== filter.value;
      case '<':
        return value < filter.value;
      case '<=':
        return value <= filter.value;
      case '>':
        return value > filter.value;
      case '>=':
        return value >= filter.value;
      case 'in':
        // eslint-disable-next-line no-case-declarations
        const array = JSON.parse(filter.value as string);
        return array.includes(value);
      default:
        return false;
    }
  }));
}
export default applyFilters;
