import {
  createMemo,
  createResource,
  createSignal,
  For,
  JSX,
  onCleanup,
  onMount,
  Show,
} from 'solid-js';
import { createMutable, produce } from 'solid-js/store';
import { autofocus } from '@solid-primitives/autofocus';

// Import from other packages
import { FaSolidTrashCan } from 'solid-icons/fa';
import { VsTriangleDown, VsTriangleRight } from 'solid-icons/vs';
import toast from 'solid-toast';
import { AllGeoJSON, bbox as computeBbox } from '@turf/turf';
import { v4 as uuidv4 } from 'uuid';

// Helpers
import d3 from '../helpers/d3-custom';
import { useI18nContext } from '../i18n/i18n-solid';
import {
  convertAndAddFiles,
  CustomFileList,
  FileEntry,
  prepareFilterAndStoreFiles,
} from '../helpers/fileUpload';
import { mergeBboxes } from '../helpers/geo';
import {
  allowedFileExtensions,
  shapefileExtensions,
  shapefileMandatoryExtensions,
  SupportedGeoFileTypes,
  SupportedTabularFileTypes,
} from '../helpers/supportedFormats';
import { findCsvDelimiter, getDatasetInfo } from '../helpers/formatConversion';
import { removeNadGrids } from '../helpers/projection';

// Stores
import { fileDropStore, setFileDropStore } from '../store/FileDropStore';
import { globalStore, setGlobalStore } from '../store/GlobalStore';
import {
  layersDescriptionStore,
  type LayersDescriptionStoreType,
  setLayersDescriptionStore,
} from '../store/LayersDescriptionStore';
import { mapStore, setMapStore } from '../store/MapStore';
import { setModalStore } from '../store/ModalStore';

// Other components
import MessageBlock from './MessageBlock.tsx';
import SimplificationModal from './Modals/SimplificationModal.tsx';
import { openLayerManager } from './LeftMenu/LeftMenu.tsx';

// Styles
import '../styles/ImportWindow.css';

interface LayerOrTableDescription {
  name: string,
  features: number,
  type: 'tabular' | 'geo',
  geometryType?: 'point' | 'line' | 'polygon' | 'unknown',
  crs?: GdalCrs,
  delimiter?: string,
  addToProject: boolean,
  useCRS: boolean,
  simplify: boolean,
  fitMap: boolean,
}

interface DatasetInformation {
  name: string,
  detailedType: SupportedGeoFileTypes | SupportedTabularFileTypes | 'Unknown',
  complete: boolean,
  layers: LayerOrTableDescription[],
}

interface InvalidDataset {
  name: string,
  valid: boolean,
  reason: string,
}

interface DatasetDescription {
  name: string,
  files: FileEntry[],
  info: DatasetInformation,
}

interface GdalCrs {
  name: string,
  code?: string,
  wkt?: string,
  bounds?: number[],
}

const countLayerToImport = (fileDescriptions: DatasetDescription[]) => {
  if (!fileDescriptions) return 0;
  let total = 0;
  fileDescriptions.forEach((f: DatasetDescription) => {
    f.info.layers.forEach((l: LayerOrTableDescription) => {
      if (l.addToProject) {
        total += 1;
      }
    });
  });

  return total;
};

const convertBounds = (
  bbox?: {
    east_longitude: number, north_latitude: number, south_latitude: number, west_longitude: number,
  },
) => {
  if (!bbox) return undefined;
  const {
    east_longitude: east,
    north_latitude: north,
    south_latitude: south,
    west_longitude: west,
  } = bbox;
  return [north, west, south, east];
};

const readCrs = (geomColumn: any): GdalCrs => {
  if (
    geomColumn.coordinateSystem?.projjson?.id?.code
    && geomColumn.coordinateSystem?.projjson?.id?.authority
  ) {
    return {
      name: geomColumn.coordinateSystem?.projjson?.name,
      code: `${geomColumn.coordinateSystem.projjson.id.authority}:${geomColumn.coordinateSystem.projjson.id.code}`,
      wkt: geomColumn.coordinateSystem?.wkt,
      bounds: convertBounds(geomColumn.coordinateSystem?.projjson?.bbox),
    };
  }
  return {
    name: geomColumn.coordinateSystem?.projjson?.name,
    code: undefined,
    wkt: geomColumn.coordinateSystem?.wkt,
    bounds: convertBounds(geomColumn.coordinateSystem?.projjson?.bbox),
  };
};

const formatCrsTitle = (
  crs: { name: string, code?: string, wkt?: string },
) => {
  if (crs.code && crs.wkt) {
    return `${crs.code} - ${crs.wkt}`;
  }
  if (crs.wkt) {
    return crs.wkt;
  }
  if (crs.code) {
    return crs.code;
  }
  return 'Unknown';
};

const analyseTabularDatasetGDAL = async (
  fileOrFiles: FileEntry | FileEntry[],
): Promise<DatasetInformation | InvalidDataset> => {
  const ds = Array.isArray(fileOrFiles)
    ? fileOrFiles.map((fe) => fe.file)
    : fileOrFiles.file;
  const name = Array.isArray(fileOrFiles)
    ? fileOrFiles[0].name
    : fileOrFiles.name;

  let result;

  try {
    result = await getDatasetInfo(
      ds,
      { opts: ['-wkt_format', 'WKT1'] },
    );
  } catch (e: any) {
    return {
      name,
      valid: false,
      reason: e.message ? e.message : 'Unknown error',
    } as InvalidDataset;
  }

  const layers = result.layers.map((layer: any) => ({
    name: layer.name,
    type: 'tabular',
    features: layer.featureCount,
    useCRS: false,
    addToProject: true,
    simplify: false,
    fitMap: false,
  }));

  /* eslint-disable no-nested-ternary */
  const detailedType = result.driverLongName === 'Open Document Spreadsheet'
    ? SupportedTabularFileTypes.ODS
    : result.driverLongName === 'MS Excel format'
      ? SupportedTabularFileTypes.XLS
      : result.driverLongName === 'MS Office Open XML spreadsheet'
        ? SupportedTabularFileTypes.XLSX : 'Unknown';
  /* eslint-enable no-nested-ternary */

  return {
    name,
    detailedType,
    complete: true,
    layers,
  };
};

const analyseGeospatialDatasetGDAL = async (
  fileOrFiles: FileEntry | FileEntry[],
): Promise<DatasetInformation | InvalidDataset> => {
  const ds = Array.isArray(fileOrFiles)
    ? fileOrFiles.map((fe) => fe.file)
    : fileOrFiles.file;
  const name = Array.isArray(fileOrFiles)
    ? fileOrFiles[0].name
    : fileOrFiles.name;

  let result;

  try {
    result = await getDatasetInfo(
      ds,
      { opts: ['-wkt_format', 'WKT1'] },
    );
  } catch (e: any) {
    return {
      name,
      valid: false,
      reason: e.message ? e.message : 'Unknown error',
    } as InvalidDataset;
  }

  const layers = result.layers.map((layer: any) => {
    if (layer.geometryFields.length > 0) {
      // We have a layer with geometries
      return {
        name: layer.name,
        features: layer.featureCount,
        type: 'geo',
        geometryType: layer.geometryFields[0] ? layer.geometryFields[0].type : 'unknown',
        crs: readCrs(layer.geometryFields[0]),
        useCRS: false,
        addToProject: true,
        simplify: false,
        fitMap: false,
      };
    } else { // eslint-disable-line no-else-return
      // We have a tabular layer
      return {
        name: layer.name,
        features: layer.featureCount,
        type: 'tabular',
        useCRS: false,
        addToProject: true,
        simplify: false,
        fitMap: false,
      };
    }
  });

  /* eslint-disable no-nested-ternary */
  const detailedType = result.driverLongName === 'GeoPackage'
    ? SupportedGeoFileTypes.GeoPackage
    : result.driverLongName === 'ESRI Shapefile'
      ? SupportedGeoFileTypes.Shapefile
      : result.driverLongName === 'Keyhole Markup Language (KML)'
        ? SupportedGeoFileTypes.KML
        : result.driverLongName === 'GeoJSON'
          ? SupportedGeoFileTypes.GeoJSON
          : result.driverLongName === 'Geographic Markup Language (GML)'
            ? SupportedGeoFileTypes.GML
            : result.driverLongName === 'TopoJSON'
              ? SupportedGeoFileTypes.TopoJSON : 'Unknown';
  /* eslint-enable no-nested-ternary */
  return {
    name,
    detailedType,
    complete: true,
    layers,
  };
};

const analyzeDatasetTopoJSON = (
  content: string,
  name: string,
): DatasetInformation | InvalidDataset => {
  const obj = JSON.parse(content);
  return {
    name,
    detailedType: SupportedGeoFileTypes.TopoJSON,
    complete: true,
    layers: Object.keys(obj.objects).map((layerName) => ({
      name: layerName,
      type: 'geo',
      features: obj.objects[layerName].geometries.length,
      geometryType: obj.objects[layerName].geometries[0]?.type || 'unknown',
      crs: {
        name: 'WGS 84',
        code: 'EPSG:4326',
        wkt: 'GEOGCS["WGS 84", DATUM["WGS_1984", SPHEROID["WGS 84",6378137,298.257223563, AUTHORITY["EPSG","7030"]], AUTHORITY["EPSG","6326"]], PRIMEM["Greenwich",0, AUTHORITY["EPSG","8901"]], UNIT["degree",0.0174532925199433, AUTHORITY["EPSG","9122"]], AUTHORITY["EPSG","4326"]]',
      },
      addToProject: true,
      simplify: false,
      fitMap: false,
      useCRS: false,
    })),
  };
};

const analyseDatasetTabularJSON = (
  content: string,
  name: string,
): DatasetInformation | InvalidDataset => {
  const obj = JSON.parse(content);

  if (!Array.isArray(obj)) {
    return {
      name,
      valid: false,
      reason: 'The JSON file is not an array of objects',
    };
  }
  return {
    name,
    detailedType: SupportedTabularFileTypes.JSON,
    complete: true,
    layers: [
      {
        name,
        features: obj.length,
        type: 'tabular',
        addToProject: true,
        simplify: false,
        useCRS: false,
        fitMap: false,
      },
    ],
  };
};

const analyseDatasetTabularText = (
  content: string,
  name: string,
  ext: 'csv' | 'tsv' | 'txt',
): DatasetInformation | InvalidDataset => {
  const delimiter = findCsvDelimiter(content);
  const ds = d3.dsvFormat(delimiter).parse(content);
  // eslint-disable-next-line no-nested-ternary
  const detailedType = ext === 'csv'
    ? SupportedTabularFileTypes.CSV
    : ext === 'tsv'
      ? SupportedTabularFileTypes.TSV
      : SupportedTabularFileTypes.TXT;

  return {
    name,
    detailedType,
    complete: true,
    layers: [
      {
        name,
        type: 'tabular',
        features: ds.length,
        delimiter,
        addToProject: true,
        useCRS: false,
        simplify: false,
        fitMap: false,
      },
    ],
  };
};

const analyzeDataset = async (
  ds: { [key: string]: { name: string, files: FileEntry[] } },
): Promise<DatasetInformation | InvalidDataset> => {
  // We need to determine the type of the file, based on the extension and/or
  // the mime type.
  // In some cases, we need to read the file to determine the type (e.g. geojson vs. topojson).
  // There is some special cases :
  //  - for Shapefiles, we need to check if there is all the
  //    needed files (shp, shx, dbf, prj and optionally cpg)
  //  - for TopoJSON, we need to open the dataset to list the layers
  //  - for CSV, we need to check if there is a geometry column
  //  - for GeoPackage, we need to open the dataset to list the layers
  //  - for KML, we need to open the dataset to list the layers
  // Extract the name of the dataset
  const name = Object.keys(ds)[0];
  // Create the result object
  let result: Partial<DatasetInformation> = {
    name,
  };
  // Determine the type of the dataset
  if (ds[name].files.length === 1) {
    // Only one file
    const file = ds[name].files[0];
    if (file.file.type.includes('json') || file.ext.includes('json')) {
      // At this point we have a JSON file, it can be a GeoJSON or a TopoJSON or
      // tabular data or something else...
      // Read the file to determine the type
      const content = await file.file.text();
      if (content === '') {
        // TODO: investigate if using https://developer.mozilla.org/en-US/docs/Web/API/File_and_Directory_Entries_API/Introduction
        //  could help to avoid obtaining empty files
        //  when reading files that are very large...
        result = {
          name,
          valid: false,
          reason: 'Empty content or too large file',
        } as InvalidDataset;
      } else if (content.includes('"FeatureCollection"')) {
        // We have a GeoJSON file
        // result = analyseDatasetGeoJSON(content, name);
        result = await analyseGeospatialDatasetGDAL(file);
      } else if (content.includes('"Topology"')) {
        // We have a TopoJSON file
        result = analyzeDatasetTopoJSON(content, name);
      } else {
        // We have a JSON file but it's not a GeoJSON or a TopoJSON
        // So it's probably tabular data.
        result = analyseDatasetTabularJSON(content, name);
      }
    } else if (file.file.type.includes('text/') || ['tsv', 'csv', 'txt'].includes(file.ext)) {
      // We have a text file, it can be a CSV or a TSV or something else...
      // Read the file to determine the type
      const content = await file.file.text();
      result = analyseDatasetTabularText(content, name, file.ext as 'csv' | 'tsv' | 'txt');
    } else if (
      file.file.type === 'application/vnd.ms-excel'
      || file.file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      || file.file.type === 'application/vnd.oasis.opendocument.spreadsheet'
    ) {
      result = await analyseTabularDatasetGDAL(file);
    } else if (
      file.file.type === 'application/geopackage+sqlite3'
      || file.file.type === 'application/gml+xml'
      || file.file.type === 'application/vnd.google-earth.kml+xml'
      // TODO: handle zip files...
    ) {
      result = await analyseGeospatialDatasetGDAL(file);
    } else if (
      shapefileExtensions.includes(file.ext)
    ) {
      result = {
        name,
        detailedType: SupportedGeoFileTypes.Shapefile,
        complete: false,
        layers: [],
      };
    }
  } else { // We have multiple files, so it's probably a shapefile
    const exts = ds[name].files.map((f) => f.ext);
    if (!shapefileMandatoryExtensions.every((e) => exts.includes(e))) {
      result = {
        name,
        detailedType: SupportedGeoFileTypes.Shapefile,
        complete: false,
        layers: [],
      };
    } else {
      result = await analyseGeospatialDatasetGDAL(ds[name].files);
    }
  }

  return result as DatasetInformation;
};

const extTransform = (ext) => {
  if (shapefileExtensions.includes(ext)) {
    return 'shp';
  }
  return ext;
};

const groupFiles = (
  files: CustomFileList,
): { [key: string]: { name: string, files: FileEntry[] } } => {
  // We want to group the files by their name (because shapefiles have multiple files)
  // but other files have only one file (and we want to avoid grouping
  // other files than shapefiles).
  const groupedFiles: { [key: string]: { name: string, files: FileEntry[] } } = {};
  files.forEach((file) => {
    const key = `${file.name}.${extTransform(file.ext)}`;
    if (groupedFiles[key] === undefined) {
      groupedFiles[key] = {
        name: file.name,
        files: [file],
      };
    } else {
      if (
        groupedFiles[key].files.some((f) => (
          f.name === file.name
          && f.ext === file.ext
          && f.file.size === file.file.size
          && f.file.lastModified === file.file.lastModified))
      ) {
        return;
      }
      groupedFiles[key].files.push(file);
    }
  });
  return groupedFiles;
};

const formatFileExtension = (exts: string[]): string => {
  if (exts.length > 1) {
    return `{${exts.join(',')}}`;
  }
  return exts[0];
};

export default function ImportWindow(): JSX.Element {
  const { LL } = useI18nContext();
  let refParentNode: HTMLDivElement;

  function handleInputFiles() {
    const input = document.createElement('input');
    const aft = allowedFileExtensions.map((ext) => `.${ext}`).join(', ');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', aft);
    input.setAttribute('multiple', '');
    input.onchange = async (event) => {
      // Store the supported files in the fileDropStore
      // and display a toast message for the unsupported files
      const unsupportedFiles = prepareFilterAndStoreFiles(
        (event.target as HTMLInputElement).files!,
        fileDropStore,
        setFileDropStore,
      );

      unsupportedFiles.forEach((file) => {
        toast.error(LL().ImportWindow.UnsupportedFileFormat({ file }));
      });
    };
    input.click();
  }

  const droppedFiles = createMemo(() => fileDropStore.files);

  const [fileDescriptions] = createResource<any, any>(
    droppedFiles,
    async () => {
      const groupedFiles = groupFiles(droppedFiles());
      const invalidToBeRemoved: string[] = [];
      const resultValue = createMutable((await Promise.all(
        Object.keys(groupedFiles)
          .map(async (fileName) => {
            const fd = groupedFiles[fileName];
            // Use existing description if available
            if (
              fileDescriptions()
                .find((f: DatasetDescription) => f.name === fileName && f.info && f.info.complete)
            ) {
              return fileDescriptions().find((f: DatasetDescription) => f.name === fileName);
            }

            const dsInfo = await analyzeDataset({ [fd.name]: fd });
            if ('valid' in dsInfo && !dsInfo.valid) {
              // We have an invalid dataset that we don't wan't to add to the list.
              // We display a toast message to inform the user and we remove the file
              // from the fileDropStore (see below).
              toast.error(LL().ImportWindow.ErrorReadingFile({
                file: fileName,
                message: (dsInfo as InvalidDataset).reason,
              }));
              invalidToBeRemoved.push(fileName);
              return null;
            }
            return {
              ...groupedFiles[fileName],
              info: dsInfo as DatasetInformation,
            } as DatasetDescription;
          }),
      )).filter((f) => f !== null));

      // Remove invalid entries from the fileDropStore
      if (invalidToBeRemoved.length > 0) {
        setFileDropStore(
          'files',
          fileDropStore.files.filter((f) => !invalidToBeRemoved.includes(f.name)),
        );
      }

      return resultValue;
    },
  );

  const [hidden, setHidden] = createSignal<string[]>([]);

  const handleHidden = (name: string) => () => {
    if (hidden().includes(name)) {
      setHidden(hidden().filter((n) => n !== name));
    } else {
      setHidden([...hidden(), name]);
    }
  };

  /**
   * Handle click on checkboxes to set the "fitMap" or "useCRS" property of a layer
   * (because only one layer can have this property set to true).
   *
   * @param {LayerOrTableDescription} layer
   * @param {'fitMap' | 'useCRS'} prop
   * @returns {void}
   */
  const handleCheckUnique = (layer: LayerOrTableDescription, prop: 'fitMap' | 'useCRS'): void => {
    const newCheckedState = !layer[prop];
    if (newCheckedState) {
      // Remove the checked state of the other datasets
      fileDescriptions().forEach((f: DatasetDescription) => {
        f.info.layers.forEach((l: LayerOrTableDescription) => {
          // eslint-disable-next-line no-param-reassign
          l[prop] = false;
        });
      });
    }
    // eslint-disable-next-line no-param-reassign
    layer[prop] = newCheckedState;
  };

  const listenerEscKey = (event: KeyboardEvent) => {
    const isEscape = event.key
      ? (event.key === 'Escape' || event.key === 'Esc')
      : (event.keyCode === 27);
    // We block the escape key if the loading is active
    if (isEscape && !fileDescriptions.loading) {
      (refParentNode.querySelector('.cancel-button') as HTMLElement).click();
    }
  };

  onMount(() => {
    document.addEventListener('keydown', listenerEscKey);
  });

  onCleanup(() => {
    document.removeEventListener('keydown', listenerEscKey);
  });

  return <div class="modal-window modal overlay-drop" style={{ display: 'flex' }} ref={refParentNode!}>
    <div class="modal-background"></div>
    <div
      class="modal-card"
      style={{ width: 'min(1400px, 95vw)', height: '80vh' }}
    >
      <section class="modal-card-body">
        <h2>{ LL().ImportWindow.Title() }</h2>
        <MessageBlock type={'info'}>
          <p>{ LL().ImportWindow.Instructions() }</p>
          <p>{LL().ImportWindow.SupportedVectorFormats()}</p>
          <p>{LL().ImportWindow.SupportedTabularFormats()}</p>
          <p>{LL().ImportWindow.InstructionNotFolder()}</p>
        </MessageBlock>
        <div class="has-text-centered mb-4">
          <button
            class="button is-primary is-outlined"
            onClick={handleInputFiles}
            ref={autofocus}
            autofocus={true}
          >
            {LL().ImportWindow.Open()}
          </button>
        </div>
        <table class="table file-import-table">
          <thead>
          <Show when={hidden().length > 0}>
              <tr>
                <th></th>
                <th>{ LL().ImportWindow.LayerName() }</th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th>{ LL().ImportWindow.Delete() }</th>
              </tr>
            </Show>
            <Show when={hidden().length === 0}>
              <tr>
                <th></th>
                <th>{ LL().ImportWindow.LayerName() }</th>
                <th>{ LL().ImportWindow.Features() }</th>
                <th>{ LL().ImportWindow.GeometryType() }</th>
                <th>{ LL().ImportWindow.CRS() }</th>
                <th>{ LL().ImportWindow.UseProjection() }</th>
                <th>{ LL().ImportWindow.Simplify() }</th>
                <th>{ LL().ImportWindow.FitExtent() }</th>
                <th>{ LL().ImportWindow.Delete() }</th>
              </tr>
            </Show>
          </thead>
          <tbody>
            <For each={fileDescriptions()}>
              {
                (fileDescription) => <>
                  <tr class="entry-title">
                    <td>
                      <Show
                        when={!hidden().includes(fileDescription.info.name)}
                        fallback={
                          <VsTriangleRight class="is-clickable" onClick={handleHidden(fileDescription.info.name)}/>
                        }
                      >
                        <VsTriangleDown class="is-clickable" onClick={handleHidden(fileDescription.info.name)}/>
                      </Show>
                    </td>
                    <td onClick={handleHidden(fileDescription.info.name)}>
                      {fileDescription.info.name}
                      .{formatFileExtension(fileDescription.files.map((f: FileEntry) => f.ext))}
                      <Show when={!fileDescription.info.complete}>
                        <span
                          class="tag is-warning ml-3"
                          style={{ 'vertical-align': 'top' }}
                          title={ LL().ImportWindow.IncompleteMessage() }
                        >
                          { LL().ImportWindow.Incomplete() }
                        </span>
                      </Show>
                    </td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td>
                      <FaSolidTrashCan
                        class="is-clickable"
                        aria-label={ LL().ImportWindow.Delete() }
                        onClick={() => {
                          setFileDropStore(
                            'files',
                            fileDropStore.files
                              .filter((f) => f.name !== fileDescription.info.name),
                          );
                          if (hidden().includes(fileDescription.info.name)) {
                            setHidden(hidden().filter((n) => n !== fileDescription.info.name));
                          }
                        }}
                      />
                    </td>
                  </tr>
                  <Show when={!hidden().includes(fileDescription.info.name)}>
                    <For each={fileDescription.info.layers}>
                      {
                        (layer) => {
                          const randomId = uuidv4();
                          if (layer.type === 'geo') {
                            return <tr class="entry-detail">
                              <td>
                                <input
                                  type="checkbox"
                                  checked={layer.addToProject}
                                  aria-label={ LL().ImportWindow.AddToProject() }
                                  onClick={() => {
                                    // eslint-disable-next-line no-param-reassign
                                    layer.addToProject = !layer.addToProject;
                                  }}
                                  id={randomId}
                                /></td>
                              <td>
                                <label
                                  for={randomId}
                                  style={{ display: 'inline-block', width: '100%' }}
                                >
                                  ↳ {layer.name}
                                </label>
                              </td>
                              <td>{LL().ImportWindow.NFeatures(layer.features)}</td>
                              <td>{layer.geometryType || 'None'}</td>
                              <td
                                title={formatCrsTitle(layer.crs)}
                              >
                                { // eslint-disable-next-line no-nested-ternary
                                  layer.crs.name
                                    ? layer.crs.name
                                    : layer.crs.code
                                      ? layer.crs.code : layer.crs.wkt
                                }
                              </td>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={layer.useCRS}
                                  aria-label={ LL().ImportWindow.UseProjection() }
                                  onClick={() => handleCheckUnique(layer, 'useCRS')}
                                /></td>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={layer.simplify}
                                  disabled={layer.geometryType.toLowerCase().includes('point')}
                                  title={
                                    layer.geometryType.toLowerCase().includes('point')
                                      ? LL().ImportWindow.SimplifyDisabledTooltip()
                                      : LL().ImportWindow.SimplifyTooltip()
                                  }
                                  aria-label={ LL().ImportWindow.Simplify() }
                                  onClick={() => {
                                    // eslint-disable-next-line no-param-reassign
                                    layer.simplify = !layer.simplify;
                                  }}
                                /></td>
                              <td>
                                <input
                                  type="checkbox"
                                  class="fit-map"
                                  checked={layer.fitMap}
                                  aria-label={ LL().ImportWindow.FitExtent() }
                                  onClick={() => handleCheckUnique(layer, 'fitMap')}
                                />
                              </td>
                              <td></td>
                            </tr>;
                          }
                          return <tr class="entry-detail">
                            <td>
                              <input
                                type="checkbox"
                                checked={layer.addToProject}
                                aria-label={LL().ImportWindow.AddToProject()}
                                onClick={() => {
                                  // eslint-disable-next-line no-param-reassign
                                  layer.addToProject = !layer.addToProject;
                                }}
                                id={randomId}
                              /></td>
                            <td>
                              <label
                                for={randomId}
                                style={{ display: 'inline-block', width: '100%' }}
                              >
                                ↳ {layer.name}
                              </label>
                            </td>
                            <td>{LL().ImportWindow.NFeatures(layer.features)}</td>
                            <td><i>NA</i></td>
                            <td><i>NA</i></td>
                            <td><i>NA</i></td>
                            <td><i>NA</i></td>
                            <td><i>NA</i></td>
                            <td></td>
                          </tr>;
                        }
                      }
                    </For>
                  </Show>
                </>
              }
            </For>
            <Show when={fileDescriptions.loading}>
              <tr>
                <td></td>
                <td>
                  <button
                    class="button is-loading"
                    style={{
                      border: 0,
                      padding: '0.1 1em',
                      'vertical-align': 'middle',
                    }}
                  >Loading...</button>
                  {LL().ImportWindow.AnalyzingDataset()}</td>
              </tr>
            </Show>
          </tbody>
        </table>
      </section>
      <footer class="modal-card-foot">
        <button
          disabled={
            fileDescriptions.loading
            || droppedFiles().length === 0
            || countLayerToImport(fileDescriptions()) === 0
          }
          class="button is-success confirm-button"
          onClick={async () => {
            // Remove the "drop" overlay
            setFileDropStore({ show: false, files: [] });
            // Add the "loading" overlay
            setGlobalStore({ isLoading: true });

            let needToZoomOnTotalExtent;
            const bboxes: [number, number, number, number][] = [];

            // Does the user already added a layer to the project?
            if (!globalStore.userHasAddedLayer) {
              setLayersDescriptionStore(
                produce(
                  (draft: LayersDescriptionStoreType) => {
                    // eslint-disable-next-line no-param-reassign
                    draft.layers = [];
                  },
                ),
              );
              setGlobalStore({ userHasAddedLayer: true });
              // Does the user want to zoom on a specific layer ?
              // If no, and since there is no layer in the project, we will
              // zoom on the combined extent of all the layers.
              let wantToZoom = false;
              fileDescriptions()
                .forEach((ds: DatasetDescription) => {
                  ds.info.layers.forEach((l: LayerOrTableDescription) => {
                    if (l.fitMap) {
                      wantToZoom = true;
                    }
                  });
                });
              if (!wantToZoom) {
                needToZoomOnTotalExtent = true;
              }
            }

            // Do we have to use a specific CRS ?
            let crsToUse: GdalCrs | undefined;
            fileDescriptions()
              .forEach((ds: DatasetDescription) => {
                ds.info.layers.forEach((l: LayerOrTableDescription) => {
                  if (l.useCRS) {
                    crsToUse = l.crs;
                  }
                });
              });
            if (crsToUse) {
              setMapStore(
                'projection',
                {
                  type: 'proj4',
                  name: crsToUse.name,
                  value: removeNadGrids(crsToUse.wkt as string),
                  bounds: crsToUse.bounds,
                  code: crsToUse.code,
                },
              );
            }
            // Disable type checking here as we will reuse immediately the content of the array
            const dsToImport: never[][] = [];
            const dsToSimplify: string[] = [];
            // Import the selected datasets
            await Promise.all(fileDescriptions().map(async (ds: DatasetDescription) => {
              await Promise.all(ds.info.layers.map(async (l: LayerOrTableDescription) => {
                if (l.addToProject) {
                  // We push the necessary information to an array,
                  // then we will loop on this array (this seems to
                  // avoid some problems with async/await and context switching
                  // when we need to import multiple layers from the same GeoPackage file).
                  dsToImport.push(
                    [
                      ds.files, ds.info.detailedType,
                      l.type, l.name, l.fitMap, l.simplify,
                    ] as never[],
                  );
                }
              }));
            }));

            for (let i = 0; i < dsToImport.length; i += 1) {
              const [
                files, format, type,
                name, fitMap, simplify,
              ] = dsToImport[i];
              // Layers that will be simplified are not visible by default
              // (so they are not mounted now on the map).
              const shouldBeVisible = !simplify;
              // We want to wait for the import of the current layer to be finished
              // before starting to import the next one...
              // Note that convertAndAddFiles can throw an error, so we need to
              // catch it here.
              try {
                // eslint-disable-next-line no-await-in-loop
                const { id, nRemoved } = await convertAndAddFiles(
                  files,
                  format,
                  type,
                  name,
                  fitMap,
                  shouldBeVisible,
                );

                // If the user is adding its first layer(s)
                // and didn't specify a layer to zoom on, we need to compute the bbox
                // of the layer(s) to zoom on the total extent.
                if (needToZoomOnTotalExtent) {
                  const data = layersDescriptionStore.layers.find((d) => d.id === id)?.data;
                  if (data) {
                    bboxes.push(
                      computeBbox(data as AllGeoJSON) as [number, number, number, number],
                    );
                  }
                }

                // If there are empty features, we display a toast to
                // inform the user about it.
                if (nRemoved > 0) {
                  toast.error(LL().ImportWindow.RemovedEmptyFeatures({ nRemoved, name }));
                }
                // We push the id of the layer(s) to simplify to an array,
                // and when all the layers are imported, we will simplify
                // it/them.
                if (simplify) {
                  dsToSimplify.push(id);
                }
              } catch (e: any) {
                // We catch the error here and display a toast
                // toast.error(`Error while reading file: ${e.message ? e.message : e}`);
                toast.error(LL().ImportWindow.ErrorReadingFile({
                  file: name,
                  message: e.message ? `${e.message}` : `${e}`,
                }));
              }
            }

            if (needToZoomOnTotalExtent) {
              // Fit the map on the extent of the layers
              // (plus some margin around the layers).
              const mergedBbox = mergeBboxes(bboxes);
              globalStore.projection.fitExtent(
                [
                  [
                    mapStore.mapDimensions.width * 0.03,
                    mapStore.mapDimensions.height * 0.03,
                  ],
                  [
                    mapStore.mapDimensions.width - mapStore.mapDimensions.width * 0.03,
                    mapStore.mapDimensions.height - mapStore.mapDimensions.height * 0.03,
                  ],
                ],
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Polygon',
                    coordinates: [
                      [
                        [mergedBbox[0], mergedBbox[1]],
                        [mergedBbox[0], mergedBbox[3]],
                        [mergedBbox[2], mergedBbox[3]],
                        [mergedBbox[2], mergedBbox[1]],
                        [mergedBbox[0], mergedBbox[1]],
                      ],
                    ],
                  },
                },
              );

              setMapStore({
                scale: globalStore.projection.scale(),
                translate: globalStore.projection.translate(),
              });
            }

            // Remove the "loading" overlay
            setGlobalStore({ isLoading: false });

            // Open the layer manager section on the left menu
            openLayerManager();

            // The layers are loaded and the loading overlay is removed,
            // we can now display the simplification modal if needed.
            if (dsToSimplify.length > 0) {
              setModalStore({
                show: true,
                title: LL().SimplificationModal.Title(),
                content: () => <SimplificationModal ids={dsToSimplify}/>,
                width: '65vw',
              });
            }
          }}
        > {LL().ImportWindow.ImportButton(countLayerToImport(fileDescriptions()))}
        </button>
        <button
          class="button cancel-button"
          onClick={() => {
            // Remove the "drop" overlay
            setFileDropStore({ show: false, files: [] });
          }}
        > {LL().ImportWindow.CancelButton()}
        </button>
      </footer>
    </div>
  </div>;
}
