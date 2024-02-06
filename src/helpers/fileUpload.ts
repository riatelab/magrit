// Imports from solid-js
import { produce } from 'solid-js/store';

// Imports from external packages
import toast from 'solid-toast';
import { getPalette } from 'dicopal';

// Helpers
import {
  convertBinaryTabularDatasetToJSON,
  convertTabularDatasetToJSON,
  convertToGeoJSON,
  getGeometryType,
  removeFeaturesWithEmptyGeometry,
} from './formatConversion';
import { generateIdLayer, generateIdTable } from './layers';
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
import { globalStore, setGlobalStore } from '../store/GlobalStore';
import { type LayersDescriptionStoreType, setLayersDescriptionStore } from '../store/LayersDescriptionStore';
import { fitExtent } from '../store/MapStore';

// Types
import { GeoJSONFeatureCollection, LayerDescription, TableDescription } from '../global';

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
  if (
    e.dataTransfer
    && e.dataTransfer.types
    && !e.dataTransfer?.types.some((el) => el === 'Files')
  ) {
    return false;
  }
  if (e.relatedTarget && (e.relatedTarget as Node).nodeType) {
    return false;
  }
  return true;
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

export const isBinaryTabularFile = (files: CustomFileList): boolean => Object
  .keys(SupportedBinaryTabularFileTypes)
  .map((key) => SupportedBinaryTabularFileTypes[key as never] as string)
  .indexOf(files[0].ext) > -1;

export const isTopojson = async (files: CustomFileList) => files.length === 1
  && (files[0].ext === 'topojson' || files[0].ext === 'json')
  && (await files[0].file.text()).includes('Topology');

export const isGeojson = async (files: CustomFileList) => files.length === 1
  && (files[0].ext === 'geojson' || files[0].ext === 'json')
  && (await files[0].file.text()).includes('FeatureCollection');

const getDefaultRenderingParams = (geomType: string) => {
  const pal = getPalette('Vivid', 10)!.colors;
  const color = pal[Math.floor(Math.random() * pal.length)];

  if (geomType === 'point') {
    return {
      renderer: 'default',
      strokeColor: '#212121',
      strokeWidth: 1,
      strokeOpacity: 1,
      fillColor: color,
      fillOpacity: 1,
      pointRadius: 5,
      dropShadow: false,
      blurFilter: false,
    };
  }
  if (geomType === 'linestring') {
    return {
      renderer: 'default',
      strokeColor: color,
      strokeWidth: 1.5,
      strokeOpacity: 1,
      dropShadow: false,
      blurFilter: false,
    };
  }
  if (geomType === 'polygon') {
    return {
      renderer: 'default',
      strokeColor: '#212121',
      strokeWidth: 0.4,
      strokeOpacity: 1,
      fillColor: color,
      fillOpacity: 0.85,
      dropShadow: false,
      blurFilter: false,
    };
  }
  return {};
};

function addLayer(
  geojson: GeoJSONFeatureCollection,
  name: string,
  fit: boolean,
  visible: boolean,
): string {
  const rewoundGeojson = rewindLayer(geojson, true);
  const geomType = getGeometryType(rewoundGeojson);
  const layerId = generateIdLayer();

  const fieldsName: string[] = Object.keys(rewoundGeojson.features[0].properties);

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

  // Add the new layer to the LayerManager by adding it
  // to the layersDescriptionStore
  const newLayerDescription = {
    id: layerId,
    name,
    type: geomType,
    data: rewoundGeojson,
    visible,
    fields: fieldsDescription,
    ...getDefaultRenderingParams(geomType),
    shapeRendering: geomType === 'polygon' && rewoundGeojson.features.length > 10000 ? 'optimizeSpeed' : 'auto',
  };

  setLayersDescriptionStore(
    produce(
      (draft: LayersDescriptionStoreType) => {
        if (!globalStore.userHasAddedLayer) {
          // eslint-disable-next-line no-param-reassign
          draft.layers = [];
          setGlobalStore({ userHasAddedLayer: true });
        }
        draft.layers.push(newLayerDescription as LayerDescription);
      },
    ),
  );

  if (fit) {
    fitExtent(layerId);
  }

  return layerId;
}

function addTabularLayer(data: object[], name: string): string {
  const tableId = generateIdTable();
  const fields: string[] = Object.keys(data[0]);

  const descriptions = fields.map((field) => {
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
  const tableDescription = {
    id: tableId,
    name,
    fields: descriptions,
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

/**
 * Convert a layer and add it to the store (and so to the map).
 *
 * @param files
 * @param format
 * @param layerName
 * @param fit
 */
export const convertAndAddFiles = async (
  files: CustomFileList,
  format: SupportedTabularFileTypes | SupportedGeoFileTypes,
  layerName: string,
  fit: boolean,
  visible: boolean,
): Promise<string> => {
  // If the file is a TopoJSON file,
  // we don't use GDAL and convert it directly to GeoJSON
  if (format === SupportedGeoFileTypes.TopoJSON) {
    const res = convertTopojsonToGeojson(await files[0].file.text());
    const { layer, nbRemoved } = removeFeaturesWithEmptyGeometry(res[layerName]);
    toast.custom(`Removed ${nbRemoved} features with empty geometries`);
    return addLayer(layer, layerName, fit, visible);
  }

  // If the file is a tabular file, we convert it to JSON manually too
  if (!(format === SupportedGeoFileTypes.GeoJSON) && isTextualTabularFile(files)) {
    const res = await convertTabularDatasetToJSON(files[0].file, files[0].ext);
    return addTabularLayer(res, files[0].name);
  }

  // If the file is a binary tabular file, we use GDA to convert it to JSON
  if (isBinaryTabularFile(files)) {
    try {
      const opts = ['-nln', layerName, '-sql', `SELECT * FROM "${layerName}"`];
      const res = await convertBinaryTabularDatasetToJSON(
        files.map((f) => f.file),
        { opts, openOpts: [] },
      );
      return addTabularLayer(res, files[0].name);
    } catch (e: any) {
      console.error(e);
      toast.error(`Error while reading file: ${e.message ? e.message : e}`);
      // TODO: ensure that the error is handled by the caller
      throw e;
    }
  }

  // Otherwise this is a geospatial file and we use GDAL to convert the file to GeoJSON
  let res;
  try {
    const opts = format === SupportedGeoFileTypes.GeoPackage
      ? ['-nln', layerName, '-sql', `SELECT * FROM "${layerName}"`]
      : [];
    res = await convertToGeoJSON(
      files.map((f) => f.file),
      { opts, openOpts: [] },
    );
    const { layer, nbRemoved } = removeFeaturesWithEmptyGeometry(res);
    toast.custom(`Removed ${nbRemoved} features with empty geometries`);
    return addLayer(layer, layerName, fit, visible);
  } catch (e: any) {
    console.error(e);
    toast.error(`Error while reading file: ${e.message ? e.message : e}`);
    // TODO: ensure that the error is handled by the caller
    throw e;
  }
};
