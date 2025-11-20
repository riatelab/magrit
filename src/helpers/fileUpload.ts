// Imports from solid-js
import { produce, SetStoreFunction } from 'solid-js/store';

// Imports from other libs
import { toTable, toGeoJSON } from 'geoimport';

// GeoJSON types
import type { FeatureCollection } from 'geojson';

// Helpers
import {
  findSuitableName,
  isFiniteNumber, isNonNull,
  sanitizeColumnName,
} from './common';
import {
  autoTypeDataset,
  convertTextualTabularDatasetToJSON,
  getGeometryType,
  removeFeaturesWithEmptyGeometry,
} from './formatConversion';
import { generateIdLayer, generateIdTable, getDefaultRenderingParams } from './layers';
import { makeDefaultLegendDescription } from './legends';
import {
  allowedFileExtensions,
  allowedMimeTypes,
  SupportedGeoFileTypes,
  SupportedBinaryTabularFileTypes,
  SupportedTabularFileTypes,
  SupportedTextualTabularFileTypes,
} from './supportedFormats';
import { convertTopojsonToGeojson } from './topojson';
import { detectTypeField, Variable } from './typeDetection';
import rewindLayer from './rewind';

// Stores
import { FileDropStoreType } from '../store/FileDropStore';
import {
  layersDescriptionStore,
  setLayersDescriptionStore,
  type LayersDescriptionStoreType,
} from '../store/LayersDescriptionStore';
import { fitExtent } from '../store/MapStore';

// Types
import type {
  DefaultLegend,
  LayerDescription,
  TableDescription,
} from '../global';

// A file, dropped by the user
export interface FileEntry {
  // The name of the file (without the extension)
  name: string,
  // The extension of the file (e.g. 'csv')
  ext: string,
  // The actual File object
  file: File,
}

// A list of FileEntry, dropped by the user
export type CustomFileList = FileEntry[];

export function prepareFileExtensions(files: FileList): CustomFileList {
  return Array.from(files)
    .map((file: File) => {
      const name = file.name.substring(0, file.name.lastIndexOf('.'));
      const ext = file.name.substring(file.name.lastIndexOf('.') + 1, file.name.length).toLowerCase();
      const o: { name: string, ext: string, file: File } = {
        ext,
        file,
        name,
      };
      return o;
    });
}

export function draggedElementsAreFiles(e: DragEvent): boolean {
  if (!e.dataTransfer) return false;
  const { items } = e.dataTransfer;
  if (items) {
    for (let i = 0; i < items.length; i += 1) {
      if (items[i].kind === 'file') {
        return true;
      }
    }
  }
  return false;
}

export function droppedElementsAreFiles(e: DragEvent): {
  isFiles: boolean,
  reason: 'notFiles' | 'directory' | 'emptyFiles' | null,
} {
  if (!draggedElementsAreFiles(e)) {
    return {
      isFiles: false,
      reason: 'notFiles',
    };
  }
  // TODO: investigate the use of https://developer.mozilla.org/en-US/docs/Web/API/DataTransferItem/webkitGetAsEntry
  //    to handle directories better than this:
  if (
    e.dataTransfer
    && e.dataTransfer.files
    && Array.from(e.dataTransfer.files).some((f) => f.size === 4096)
  ) {
    return {
      isFiles: false,
      reason: 'directory',
    };
  }
  if (
    e.dataTransfer
    && e.dataTransfer.files
    && Array.from(e.dataTransfer.files).every((f) => f.size === 0)
  ) {
    return {
      isFiles: false,
      reason: 'emptyFiles',
    };
  }
  return {
    isFiles: true,
    reason: null,
  };
}

export function isAuthorizedFile(file: FileEntry): boolean {
  if (
    allowedMimeTypes.indexOf(file.file.type) > -1
    || allowedFileExtensions.indexOf(file.ext) > -1
  ) {
    return true;
  }
  return false;
}

export const isTabularFile = (files: CustomFileList): boolean => Object
  .keys(SupportedTabularFileTypes)
  .map((key) => SupportedTabularFileTypes[key as never] as string)
  .indexOf(files[0].ext) > -1;

export const isTextualTabularFile = (files: CustomFileList): boolean => Object
  .keys(SupportedTextualTabularFileTypes)
  .map((key) => SupportedTextualTabularFileTypes[key as never] as string)
  .indexOf(files[0].ext) > -1;

export const isBinaryTabularFile = (files: CustomFileList, type: 'tabular' | 'geo'): boolean => Object
  .keys(SupportedBinaryTabularFileTypes)
  .map((key) => SupportedBinaryTabularFileTypes[key as never] as string)
  .indexOf(files[0].ext) > -1 && type === 'tabular';

export const isTopojson = async (files: CustomFileList) => files.length === 1
  && (files[0].ext === 'topojson' || files[0].ext === 'json')
  && (await files[0].file.text()).includes('Topology');

export const isGeojson = async (files: CustomFileList) => files.length === 1
  && (files[0].ext === 'geojson' || files[0].ext === 'json')
  && (await files[0].file.text()).includes('FeatureCollection');

/**
 * Traverse the list of files dropped by the user and store the authorized files
 * in the fileDropStore.
 * Also return the list of names of the files that are not supported.
 *
 * @param {FileList} dataTransferFiles
 * @param {FileDropStoreType} fileDropStore
 * @param {SetStoreFunction<FileDropStoreType>} setFileDropStore
 * @returns {string[]}
 */
export const prepareFilterAndStoreFiles = (
  dataTransferFiles: FileList,
  fileDropStore: FileDropStoreType,
  setFileDropStore: SetStoreFunction<FileDropStoreType>,
): string[] => {
  // Store name and type of the files dropped in a new array (CustomFileList) of FileEntry.
  const files = prepareFileExtensions(dataTransferFiles);
  // Filter out the files that are not supported
  const filteredFiles = [];
  // Files that are not supported are not added to the fileDropStore
  const unsupportedFiles: string[] = [];

  for (let i = 0; i < files.length; i += 1) {
    if (isAuthorizedFile(files[i])) {
      filteredFiles.push(files[i]);
    } else {
      unsupportedFiles.push(`${files[i].name}.${files[i].ext}`);
    }
  }
  // Add the dropped files to the existing file list
  setFileDropStore(
    { files: fileDropStore.files.concat(filteredFiles) },
  );

  return unsupportedFiles;
};

function addLayer(
  geojson: FeatureCollection,
  name: string,
  fit: boolean,
  visible: boolean,
): string {
  const rewoundGeojson = rewindLayer(geojson, true);
  const geomType = getGeometryType(rewoundGeojson);
  const layerId = generateIdLayer();

  const fieldsName: string[] = Object.keys(rewoundGeojson.features[0].properties);

  // Detect the type of fields
  const fieldsDescription: Variable[] = fieldsName.map((field) => {
    const o = detectTypeField(
      rewoundGeojson.features.map((ft) => ft.properties[field]) as never[],
      field,
    );
    return {
      name: field,
      hasMissingValues: o.hasMissingValues,
      type: o.variableType,
      dataType: o.dataType,
    };
  });

  // Cast values to the detected field type if possible and needed
  fieldsDescription.forEach((field) => {
    if (field.dataType === 'number') {
      rewoundGeojson.features.forEach((ft) => {
        // eslint-disable-next-line no-param-reassign
        ft.properties[field.name] = isFiniteNumber(ft.properties[field.name])
          ? +ft.properties[field.name]
          : null;
      });
    } else {
      rewoundGeojson.features.forEach((ft) => {
        // eslint-disable-next-line no-param-reassign
        ft.properties[field.name] = isNonNull(ft.properties[field.name])
          ? ft.properties[field.name]
          : null;
      });
    }
  });

  const safeName = findSuitableName(
    name,
    layersDescriptionStore.layers.map((l) => l.name),
  );

  // Add the new layer (and the corresponding legend)
  // to the LayerManager by adding it to the layersDescriptionStore
  const newLayerDescription = {
    id: layerId,
    name: safeName,
    type: geomType,
    data: rewoundGeojson,
    visible,
    fields: fieldsDescription,
    ...getDefaultRenderingParams(geomType),
    shapeRendering: 'auto',
    // shapeRendering: geomType === 'polygon'
    //   && rewoundGeojson.features.length > 10000 ? 'optimizeSpeed' : 'auto',
  };

  const newLegendDescription = makeDefaultLegendDescription(newLayerDescription);

  setLayersDescriptionStore(
    produce(
      (draft: LayersDescriptionStoreType) => {
        // if (!globalStore.userHasAddedLayer) {
        //   // eslint-disable-next-line no-param-reassign
        //   draft.layers = [];
        //   setGlobalStore({ userHasAddedLayer: true });
        // }
        draft.layers.push(newLayerDescription as LayerDescription);
        draft.layoutFeaturesAndLegends.push(newLegendDescription as DefaultLegend);
      },
    ),
  );

  if (fit) {
    fitExtent(layerId);
  }

  return layerId;
}

function addTabularLayer(data: Record<string, any>[], name: string): string {
  const tableId = generateIdTable();
  const fields: string[] = Object.keys(data[0]);

  const fieldsDescription = fields.map((field) => {
    const o = detectTypeField(
      data.map((ft) => ft[field as keyof typeof ft]),
      field,
    );
    return {
      name: field,
      hasMissingValues: o.hasMissingValues,
      type: o.variableType,
      dataType: o.dataType,
    };
  });

  // Cast values to the detected field type if possible and needed
  fieldsDescription.forEach((field) => {
    if (field.dataType === 'number') {
      data.forEach((ft) => {
        // eslint-disable-next-line no-param-reassign
        ft[field.name] = isFiniteNumber(ft[field.name])
          ? +ft[field.name]
          : null;
      });
    } else {
      data.forEach((ft) => {
        // eslint-disable-next-line no-param-reassign
        ft[field.name] = isNonNull(ft[field.name])
          ? ft[field.name]
          : null;
      });
    }
  });

  const safeName = findSuitableName(
    name,
    layersDescriptionStore.tables.map((l) => l.name),
  );

  const tableDescription = {
    id: tableId,
    name: safeName,
    fields: fieldsDescription,
    data,
  } as TableDescription;

  setLayersDescriptionStore(
    produce(
      (draft: LayersDescriptionStoreType) => {
        // TODO: Do we want to clean the map (as we do when the first layer is added)
        //       when adding the first table?
        // if (!globalStore.userHasAddedLayer) {
        //   // eslint-disable-next-line no-param-reassign
        //   draft.layers = [];
        //   setGlobalStore({ userHasAddedLayer: true });
        // }
        draft.tables.push(tableDescription);
      },
    ),
  );

  return tableId;
}

const sanitizeColumnNamesRecords = (
  records: Record<string, unknown>[],
): Record<string, unknown>[] => {
  // Get the column names
  const columns = Object.keys(records[0]);
  // Create a new array of records with sanitized column names
  const newRecords = records.map((record) => {
    const sanitizedRecord: Record<string, unknown> = {};
    columns.forEach((column) => {
      // eslint-disable-next-line no-param-reassign
      sanitizedRecord[sanitizeColumnName(column)] = record[column];
    });
    return sanitizedRecord;
  });
  const newColumns = Object.keys(newRecords[0]);
  newRecords.columns = newColumns;
  return newRecords;
};

const sanitizeColumnNamesLayer = (
  layer: FeatureCollection,
): FeatureCollection => {
  // Get the column names
  const columns = Object.keys(layer.features[0].properties!);
  // Update the properties of each feature with sanitized column names
  layer.features.forEach((feature) => {
    // By doing so we also ensure that each feature has a non-null properties object
    const sanitizedRecord: Record<string, unknown> = {};
    columns.forEach((column) => {
      if (feature.properties) {
        // eslint-disable-next-line no-param-reassign
        sanitizedRecord[sanitizeColumnName(column)] = feature.properties![column];
      }
    });
    // eslint-disable-next-line no-param-reassign
    feature.properties = sanitizedRecord;
  });
  return layer;
};

/**
 * Convert a layer and add it to the store (and so to the map).
 *
 * @param files
 * @param format
 * @param type
 * @param layerName
 * @param fit
 * @param visible
 */
export const convertAndAddFiles = async (
  files: CustomFileList,
  format: SupportedTabularFileTypes | SupportedGeoFileTypes,
  type: 'tabular' | 'geo',
  layerName: string,
  fit: boolean,
  visible: boolean,
): Promise<{ id: string, nRemoved: number }> => {
  // If the file is a TopoJSON file,
  // we don't use GDAL and convert it directly to GeoJSON
  if (format === SupportedGeoFileTypes.TopoJSON) {
    const res = convertTopojsonToGeojson(await files[0].file.text());

    // Round coordinate precision to 6 digits after the decimal point
    // res = convertToTopojsonQuantizeAndBackToGeojson(res[layerName], 1e5);
    // We want to remove the features with empty geometries
    // (i.e. if the geometry is null or undefined or if the coordinates array is empty)
    const { layer, nbRemoved } = removeFeaturesWithEmptyGeometry(res[layerName]);
    const layerSanitized = sanitizeColumnNamesLayer(layer);
    return {
      id: addLayer(layerSanitized, layerName, fit, visible),
      nRemoved: nbRemoved,
    };
  }

  // If the file is a tabular file, we convert it to JSON manually too
  if (!(format === SupportedGeoFileTypes.GeoJSON) && isTextualTabularFile(files)) {
    const res = await convertTextualTabularDatasetToJSON(files[0].file, files[0].ext);
    return {
      id: addTabularLayer(res, files[0].name),
      nRemoved: 0,
    };
  }

  // If the file is a binary tabular file, we use GDAL to convert it to JSON
  if (isBinaryTabularFile(files, type)) {
    try {
      const res = await toTable(files.map((f) => f.file)[0], { tableName: layerName });
      const resSanitized = sanitizeColumnNamesRecords(res);
      const resTyped = autoTypeDataset(resSanitized);
      return {
        id: addTabularLayer(resTyped, layerName),
        nRemoved: 0,
      };
    } catch (e: any) {
      console.error(e);
      throw e;
    }
  }

  // Otherwise this is a geospatial file and we use GDAL to convert the file to GeoJSON
  let res;
  try {
    res = await toGeoJSON(
      files.map((f) => f.file),
      {
        layerName,
        writeBbox: true,
        rfc7946: false,
        writeNonFiniteValues: true,
      },
    );

    // Round coordinate precision to 6 digits after the decimal point
    // res = convertToTopojsonQuantizeAndBackToGeojson(res, 1e5);

    // We want to remove the features with empty geometries
    // (i.e. if the geometry is null or undefined or if the coordinates array is empty)
    const { layer, nbRemoved } = removeFeaturesWithEmptyGeometry(res);
    const layerSanitized = sanitizeColumnNamesLayer(layer);
    return {
      id: addLayer(layerSanitized, layerName, fit, visible),
      nRemoved: nbRemoved,
    };
  } catch (e: any) {
    console.error(e);
    throw e;
  }
};
