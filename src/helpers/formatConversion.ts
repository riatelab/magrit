// Import from other packages
import JSZip from 'jszip';

// GeoJSON types
import type { FeatureCollection, Feature } from 'geojson';

// Helpers
import { isFiniteNumber, sanitizeColumnName } from './common';
import d3 from './d3-custom';
import { SupportedTabularFileTypes } from './supportedFormats';

// Types
import type { FileEntry } from './fileUpload';

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

export const removeFeaturesWithEmptyGeometry = (layer: FeatureCollection) => {
  // We want features with non-empty geometries
  // (i.e each geometry is not null nor undefined and there is a non-empty coordinates array).
  const features = layer.features
    .filter((f: Feature) => (
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
 * @param {FeatureCollection} geojsonLayer
 * @returns {string}
 */
export function getGeometryType(geojsonLayer: FeatureCollection): string {
  if (geojsonLayer.type === 'Sphere') {
    return 'polygon';
  }
  // Extract the geometry type from the GeoJSON layer
  // (we don't care if it is a multi geometry - we just want the base type)
  const types: Set<string> = new Set();
  geojsonLayer.features.forEach((feature: Feature) => {
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

const PLACEHOLDER_LINE_BREAK = '||PLACEHOLDERLB||';
const PLACEHOLDER_DELIMITER = '||PLACEHOLDERDL||';
const LINESEPARATOR = '\n';

const replaceCharsInQuotes = (csvContent: string, delimiter: string): string => {
  let insideQuotes = false;
  let newContent = '';
  for (let i = 0; i < csvContent.length; i += 1) {
    if (csvContent[i] === '\r') {
      // eslint-disable-next-line no-continue
      continue;
    }
    if (csvContent[i] === '"') {
      insideQuotes = !insideQuotes;
    }
    if (csvContent[i] === LINESEPARATOR && insideQuotes) {
      newContent += PLACEHOLDER_LINE_BREAK;
    } else if (csvContent[i] === delimiter && insideQuotes) {
      newContent += PLACEHOLDER_DELIMITER;
    } else {
      newContent += csvContent[i];
    }
  }
  return newContent;
};

const restoreCharsFromPlaceholder = (csvContent: string, delimiter: string): string => csvContent
  .replaceAll(PLACEHOLDER_LINE_BREAK, '\n')
  .replaceAll(PLACEHOLDER_DELIMITER, delimiter);

export const sanitizeCsv = (rawData: string, delimiter: string): string => {
  // Replace new lines in quotes by a placeholder (we will restore them later)
  // and strip carriage returns
  let rd = replaceCharsInQuotes(rawData, delimiter);

  // Remove lines that are totally empty
  rd = rd.split(LINESEPARATOR)
    .filter((l) => l.trim() !== '')
    .join('\n');

  // Split the data into rows and columns
  const rows = rd.split(LINESEPARATOR)
    .map((row) => row.split(delimiter));

  // Remove empty columns (no data in the header and no data in any rows)
  const nonEmptyColumns = rows[0]
    .map((header, colIndex) => (
      header.trim() !== ''
      || rows.some((row, rowIndex) => rowIndex !== 0 && row[colIndex].trim() !== '')));

  const cleanedRows = rows
    .map((row) => row.filter((_, colIndex) => nonEmptyColumns[colIndex]));

  // Remove lines at the end of the file that only contain empty cells
  let lastDataRowIndex = cleanedRows.length - 1;
  while (
    lastDataRowIndex >= 0
    && cleanedRows[lastDataRowIndex].every((cell) => cell.trim() === '')
  ) {
    lastDataRowIndex -= 1;
  }
  const finalRows = cleanedRows.slice(0, lastDataRowIndex + 1);

  // Rename empty columns and sanitize the other ones
  const renamedHeader = finalRows[0]
    .map((h, i) => (
      h === '' || h === '""'
        ? `column_${i}`
        : sanitizeColumnName(restoreCharsFromPlaceholder(h, delimiter))));

  // Return cleaned data
  return [
    renamedHeader.join(delimiter),
    ...finalRows.slice(1)
      .map((row) => restoreCharsFromPlaceholder(row.join(delimiter), delimiter)),
  ].join(LINESEPARATOR);
};

export const autoTypeDataset = (dataset: d3.DSVRowArray<string>): Record<string, any>[] => {
  const cols = dataset.columns;
  for (let i = 0; i < cols.length; i += 1) {
    const tmp = [];
    // Check that all values of this field can be coerced to Number :
    for (let j = 0; j < dataset.length; j += 1) {
      if (
        dataset[j][cols[i]].replace
        && dataset[j][cols[i]] !== ''
        && (
          !Number.isNaN(+dataset[j][cols[i]].replace(',', '.'))
          || !Number.isNaN(+dataset[j][cols[i]].split(' ').join(''))
        )
      ) {
        if (
          dataset[j][cols[i]] !== '0'
          && dataset[j][cols[i]].startsWith('0')
          && !dataset[j][cols[i]].startsWith('0.')
          && !dataset[j][cols[i]].startsWith('0,')
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
      } else if (
        dataset[j][cols[i]] === 'NA'
        || dataset[j][cols[i]] === '...'
        || dataset[j][cols[i]] === ''
        || dataset[j][cols[i]] === null
        || dataset[j][cols[i]] === undefined
      ) {
        // If the value is missing, we can convert it to null.
        // We also handle a special case for 'NA' values (common in R datasets)
        // or '...' values
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
    const text = await file.text();
    const delimiter = findCsvDelimiter(text);
    return autoTypeDataset(
      d3.dsvFormat(delimiter)
        .parse(sanitizeCsv(text, delimiter)),
    );
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
