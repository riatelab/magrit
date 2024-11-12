// Import from other packages
import JSZip from 'jszip';

// Helpers
import { isFiniteNumber, sanitizeColumnName } from './common';
import d3 from './d3-custom';
import { SupportedTabularFileTypes } from './supportedFormats';

// Types
import type { GeoJSONFeatureCollection, GeoJSONFeature } from '../global';
import type { FileEntry } from './fileUpload';

/**
 * Convert the given file(s) to a GeoJSON feature collection.
 *
 * @param fileOrFiles
 * @param params
 */
export async function convertToGeoJSON(
  fileOrFiles: File | File[],
  params: { openOpts: string[]; opts: string[] } = { opts: [], openOpts: [] },
): Promise<GeoJSONFeatureCollection> {
  const openOptions = params.openOpts || [];
  const input = await globalThis.gdal.open(fileOrFiles, openOptions);
  const options = [
    '-f', 'GeoJSON',
    '-t_srs', 'EPSG:4326',
    '-lco', 'RFC7946=NO',
    '-lco', 'WRITE_NON_FINITE_VALUES=YES',
    '-lco', 'WRITE_BBOX=YES',
  ].concat(params.opts || []);
  const output = await globalThis.gdal.ogr2ogr(input.datasets[0], options);
  const bytes = await globalThis.gdal.getFileBytes(output);
  await globalThis.gdal.close(input);
  return JSON.parse(new TextDecoder().decode(bytes));
}

export async function convertBinaryTabularDatasetToJSON(
  fileOrFiles: File | File[],
  params: { openOpts: string[]; opts: string[] } = { opts: [], openOpts: [] },
): Promise<object[]> {
  const layer = await convertToGeoJSON(fileOrFiles, params);
  // We want to strip any line breaks
  // and punctuation from the column names
  const columnsBefore = Object.keys(layer.features[0].properties);
  const columnsAfter = columnsBefore.map((c) => sanitizeColumnName(c));

  return layer.features.map((f: GeoJSONFeature) => {
    const properties = {};
    for (let i = 0; i < columnsBefore.length; i += 1) {
      properties[columnsAfter[i]] = f.properties[columnsBefore[i]];
    }
    return properties;
  });
}

export const extractZipContent = async (
  file: FileEntry,
): Promise<FileEntry[]> => {
  const zip = new JSZip();
  const content = await file.file.arrayBuffer();
  const zipFile = await zip.loadAsync(content);
  return Promise.all(Object.keys(zipFile.files)
    .map((fileName) => zipFile.files[fileName])
    .filter((f) => !f.dir)
    .map(async (f) => ({
      name: f.name.substring(0, f.name.lastIndexOf('.')),
      ext: f.name.substring(f.name.lastIndexOf('.') + 1, f.name.length).toLowerCase(),
      file: new File([await f.async('blob')], f.name),
    })));
};

export const removeFeaturesWithEmptyGeometry = (layer: GeoJSONFeatureCollection) => {
  // We want features with non-empty geometries
  // (i.e each geometry is not null nor undefined and there is a non-empty coordinates array).
  const features = layer.features
    .filter((f: GeoJSONFeature) => (
      f.geometry
      && f.geometry.coordinates
      && f.geometry.coordinates.length > 0));
  const nbRemoved = layer.features.length - features.length;
  // eslint-disable-next-line no-param-reassign
  layer.features = features;
  return { layer, nbRemoved };
};

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
  const delimiters = [',', ';', '\t', '|'];
  const lines = rawText.split('\n');
  const counts = delimiters.map((d) => lines[0].split(d).length);
  const maxCount = Math.max(...counts);
  const maxIndex = counts.indexOf(maxCount);
  return delimiters[maxIndex];
}

const renameEmptyColumns = (rawData: string): string => {
  const lineSeparator = rawData.includes('\r\n') ? '\r\n' : '\n';
  const lines = rawData.split(lineSeparator);
  const header = lines[0].split(',');
  const renamedHeader = header.map((h, i) => (h === '' || h === '""' ? `column_${i}` : h));
  lines[0] = renamedHeader.join(',');
  return lines.join('\n');
};

export const removeEmptyLines = (rawData: string): string => {
  const lineSeparator = rawData.includes('\r\n') ? '\r\n' : '\n';
  return rawData
    .split(lineSeparator)
    .filter((l) => l.trim() !== '')
    .join('\n');
};

export const autoTypeDataset = (dataset: d3.DSVRowArray<string>): Record<string, any>[] => {
  const cols = dataset.columns;
  for (let i = 0; i < cols.length; i += 1) {
    const tmp = [];
    // Check that all values of this field can be coerced to Number :
    for (let j = 0; j < dataset.length; j += 1) {
      if (
        dataset[j][cols[i]].replace
        && (
          !Number.isNaN(+dataset[j][cols[i]].replace(',', '.'))
          || !Number.isNaN(+dataset[j][cols[i]].split(' ').join(''))
        )
      ) {
        if (
          dataset[j][cols[i]] !== '0'
          && dataset[j][cols[i]].startsWith('0')
          && !dataset[j][cols[i]].startsWith('0.')
        ) { // Break now if the value starts with '0' and is not a float neither a 0
          break;
        }
        // Add the converted value to temporary field if its ok ...
        const tempVal = dataset[j][cols[i]].replace(',', '.').split(' ').join('');
        if (isFiniteNumber(tempVal)) {
          tmp.push(+tempVal);
        } else {
          break;
        }
      } else if (isFiniteNumber(dataset[j][cols[i]])) {
        tmp.push(+dataset[j][cols[i]]);
      } else if (dataset[j][cols[i]] === 'NA') {
        // We also handle a special case for 'NA' values (common in R datasets)
        tmp.push(null);
      } else {
        // Or break early if a value can't be coerced :
        break; // So no value of this field will be converted
      }
    }
    // If the whole field has been converted successfully, apply the modification :
    if (tmp.length === dataset.length) {
      for (let j = 0; j < dataset.length; j += 1) {
        // eslint-disable-next-line no-param-reassign
        dataset[j][cols[i]] = tmp[j];
      }
    }
  }
  // eslint-disable-next-line no-param-reassign
  delete dataset.columns;
  return dataset;
};

export async function convertTextualTabularDatasetToJSON(
  file: File,
  ext: SupportedTabularFileTypes[keyof SupportedTabularFileTypes],
): Promise<Record<string, any>[]> {
  if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
    let text = await file.text();
    text = renameEmptyColumns(text);
    text = removeEmptyLines(text);
    const delimiter = findCsvDelimiter(text);
    return autoTypeDataset(d3.dsvFormat(delimiter).parse(text));
  }
  if (ext === 'json') {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (
      !Array.isArray(parsed)
      || !parsed.every((d) => typeof d === 'object' && d !== null)
    ) {
      throw new Error('Expected an array of objects');
    }
    return parsed;
  }
  throw new Error(`Unsupported tabular file extension: ${ext}`);
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
): Promise<string | Blob> {
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
    // Add the other files
    for (let i = 0; i < output.all.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const rawData = await globalThis.gdal.getFileBytes(output.all[i]);
      const blob = new Blob([rawData], { type: '' });
      const fileName = output.all[i].local.replace('/output/', '');
      zip.file(fileName, blob, { binary: true });
    }
    await globalThis.gdal.close(input);
    // Generate the zip file (as a Blob)
    return zip.generateAsync({ type: 'blob' });
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
    // For GPKG, we return the binary file, as blob
    const output = await globalThis.gdal.ogr2ogr(input.datasets[0], options);
    const bytes = await globalThis.gdal.getFileBytes(output);
    await globalThis.gdal.close(input);
    return bytes;
  }
  throw new Error('Unsupported vector file format');
}

export const getDatasetInfo = async (
  fileOrFiles: File | File[],
  params: { opts?: string[], openOpts?: string[] } = { opts: [], openOpts: [] },
) => {
  const openOptions = params.openOpts || [];
  const options = params.opts || [];
  const input = await globalThis.gdal.open(fileOrFiles, openOptions);
  // const result = globalThis.gdal.getInfo(input.datasets[0]);
  const result = await globalThis.gdal.ogrinfo(input.datasets[0], options);
  await globalThis.gdal.close(input);
  return result;
};
