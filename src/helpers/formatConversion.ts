import { GeoJSONFeatureCollection } from '../global';

/**
 * Convert the given file(s) to a GeoJSON feature collection.
 *
 * @param fileOrFiles
 * @param params
 */
export async function convertToGeoJSON(
  fileOrFiles: (File | File[]),
  params: { openOpts: string[]; opts: string[] } = { opts: [], openOpts: [] },
): Promise<GeoJSONFeatureCollection> {
  const openOptions = params.openOpts || [];
  const input = await window.Gdal.open(fileOrFiles, openOptions);
  const options = [
    '-f', 'GeoJSON',
    '-t_srs', 'EPSG:4326',
    '-lco', 'RFC7946=NO',
    '-lco', 'WRITE_NON_FINITE_VALUES=YES',
  ].concat(params.opts || []);
  const output = await window.Gdal.ogr2ogr(input.datasets[0], options);
  const bytes = await window.Gdal.getFileBytes(output);
  await window.Gdal.close(input);
  return JSON.parse(new TextDecoder().decode(bytes));
}

/**
 * Get the geometry type of the given GeoJSON layer.
 *
 * @param {GeoJSONFeatureCollection} geojsonLayer
 * @returns {string}
 */
export function getGeometryType(geojsonLayer: GeoJSONFeatureCollection): string {
  // Extract the geometry type from the GeoJSON layer
  // (we don't care if it is a multi geometry - we just want the base type)
  const types: Set<string> = new Set();
  geojsonLayer.features.forEach((feature: GeoJSONFeature) => {
    if (!feature.geometry) return;
    types.add(feature.geometry.type.replace('Multi', ''));
  });
  // We only support one geometry (base) type per layer
  const typesArray = Array.from(types);
  if (typesArray.length > 1) {
    throw new Error('Multiple geometry types found in GeoJSON layer');
  } else if (typesArray.length === 0) {
    throw new Error('No geometry found in GeoJSON layer');
  }
  return typesArray[0].toLowerCase();
}

export function convertTabularDataset() {
}
