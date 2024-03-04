import type { Filter, GeoJSONFeature } from '../global';

/**
 * Apply filters to a GeoJSON layer, and return the filtered layer.
 *
 * @param {GeoJSONFeature[]} features - The features to be filtered
 * @param {Filter} filters - The filters to apply to the layer
 */
function applyFilters(
  features: GeoJSONFeature[],
  filters: Filter[],
): GeoJSONFeature[] {
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
      default:
        return false;
    }
  }));
}
export default applyFilters;
