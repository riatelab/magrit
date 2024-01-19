import JSZip from 'jszip';

import { SupportedTabularFileTypes } from './supportedFormats';

// Helpers
import d3 from './d3-custom';

// Types
import type { GeoJSONFeatureCollection, GeoJSONFeature } from '../global';

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
  const input = await globalThis.gdal.open(fileOrFiles, openOptions);
  const options = [
    '-f', 'GeoJSON',
    '-t_srs', 'EPSG:4326',
    '-lco', 'RFC7946=NO',
    '-lco', 'WRITE_NON_FINITE_VALUES=YES',
  ].concat(params.opts || []);
  const output = await globalThis.gdal.ogr2ogr(input.datasets[0], options);
  const bytes = await globalThis.gdal.getFileBytes(output);
  await globalThis.gdal.close(input);
  return JSON.parse(new TextDecoder().decode(bytes));
}

/**
 * Get the geometry type of the given GeoJSON layer.
 *
 * @param {GeoJSONFeatureCollection} geojsonLayer
 * @returns {string}
 */
export function getGeometryType(geojsonLayer: GeoJSONFeatureCollection): string {
  if (geojsonLayer.type === 'Sphere') {
    return 'polygon';
  }
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

export function findCsvDelimiter(rawText: string): string {
  const delimiters = [',', ';', '\t'];
  const lines = rawText.split('\n');
  const counts = delimiters.map((d) => lines[0].split(d).length);
  const maxCount = Math.max(...counts);
  const maxIndex = counts.indexOf(maxCount);
  return delimiters[maxIndex];
}

export async function convertTabularDatasetToJSON(
  file: File,
  ext: SupportedTabularFileTypes[keyof SupportedTabularFileTypes],
): Promise<object[]> {
  console.log(file);
  if (ext === 'csv' || ext === 'tsv') {
    const text = await file.text();
    const delimiter = findCsvDelimiter(text);
    console.log('found delimiter', delimiter);
    return d3.dsvFormat(delimiter).parse(text);
  }
  if (ext === 'json') {
    const text = await file.text();
    return JSON.parse(text);
  }
  if (ext === 'txt') {
    return [];
  }
  if (ext === 'xlsx') {
    return [];
  }
  if (ext === 'xls') {
    return [];
  }
  if (ext === 'ods') {
    return [];
  }
  return [];
}

async function uintArrayToBase64(data: Uint8Array): Promise<string> {
  const base64url: string = await new Promise((r) => {
    const reader = new FileReader();
    reader.onload = () => r(reader.result);
    reader.readAsDataURL(new Blob([data]));
  });

  return base64url.substring(base64url.indexOf(',') + 1);
}

/**
 * Convert the given GeoJSON FeatureCollection to the asked format.
 *
 * @param {GeoJSONFeatureCollection} featureCollection - The GeoJSON FeatureCollection to convert
 * @param layerName - The name of the layer
 * @param format - The format to convert to
 * @param crs - The destination CRS to use
 * @returns {Promise<string>} The converted file as a string (base64 encoded if binary)
 */
export async function convertFromGeoJSON(
  featureCollection: GeoJSONFeatureCollection,
  layerName: string,
  format: string,
  crs: string,
): Promise<string> {
  // Store the input GeoJSON in a temporary file
  const inputFile = new File(
    [JSON.stringify(featureCollection)],
    `${layerName}.geojson`,
    { type: 'application/geo+json' },
  );
  // Open the GeoJSON file
  const input = await globalThis.gdal.open(inputFile);
  // Set the options for the conversion
  const options = [
    '-f', format,
  ];
  // Convert the GeoJSON to the asked format
  if (format === 'ESRI Shapefile') {
    options.push('-t_srs', crs);
    options.push('-lco', 'ENCODING=UTF-8');
    const output = await globalThis.gdal.ogr2ogr(input.datasets[0], options);
    // We will return a zip file (encoded in base 64) containing all the shapefile files
    const zip = new JSZip();
    // Add the cpg file
    zip.file(`${layerName}.cpg`, 'UTF-8');
    // Add the other files
    const shpExts = ['shp', 'shx', 'dbf', 'prj'];
    for (let i = 0; i < shpExts.length; i += 1) {
      const ext = shpExts[i];
      const outputPath = {
        local: output.local.replace('.shp', `.${ext}`),
        real: output.real.replace('.shp', `.${ext}`),
      };
      // eslint-disable-next-line no-await-in-loop
      const rawData = await globalThis.gdal.getFileBytes(outputPath);
      const blob = new Blob([rawData], { type: '' });
      zip.file(`${layerName}.${ext}`, blob, { binary: true });
    }
    await globalThis.gdal.close(input);
    // Generate the zip file (base64 encoded)
    return zip.generateAsync({ type: 'base64' });
  }
  if (format === 'GML') {
    options.push('-t_srs', crs);
    // For KML and GML, we only return a text file
    const output = await globalThis.gdal.ogr2ogr(input.datasets[0], options);
    const bytes = await globalThis.gdal.getFileBytes(output);
    await globalThis.gdal.close(input);
    return new TextDecoder().decode(bytes);
  }
  if (format === 'KML') {
    // For KML and GML, we only return a text file
    const output = await globalThis.gdal.ogr2ogr(input.datasets[0], options);
    const bytes = await globalThis.gdal.getFileBytes(output);
    await globalThis.gdal.close(input);
    return new TextDecoder().decode(bytes);
  }
  if (format === 'GPKG') {
    options.push('-t_srs', crs);
    // For GPKG, we return the binary file, encoded in base64
    const output = await globalThis.gdal.ogr2ogr(input.datasets[0], options);
    const bytes = await globalThis.gdal.getFileBytes(output);
    await globalThis.gdal.close(input);
    return uintArrayToBase64(bytes);
  }
  return '';
}

export const getDatasetInfo = async (
  fileOrFiles: File | File[],
  params = { opts: [], openOpts: [] },
) => {
  const openOptions = params.openOpts || [];
  const options = params.opts || [];
  const input = await globalThis.gdal.open(fileOrFiles, openOptions);
  // const result = globalThis.gdal.getInfo(input.datasets[0]);
  const result = await globalThis.gdal.ogrinfo(input.datasets[0], options);
  await globalThis.gdal.close(input);
  return result;
};
