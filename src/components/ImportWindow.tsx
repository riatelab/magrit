import {
  createMemo,
  createResource,
  createSignal,
  For,
  JSX,
  Show,
} from 'solid-js';
import { createMutable } from 'solid-js/store';

// Import from other packages
import { FaSolidCircleInfo, FaSolidTrashCan } from 'solid-icons/fa';
import { VsTriangleDown, VsTriangleRight } from 'solid-icons/vs';
import toast from 'solid-toast';

// Helpers
import d3 from '../helpers/d3-custom';
import { useI18nContext } from '../i18n/i18n-solid';
import {
  convertAndAddFiles,
  CustomFileList,
  FileEntry,
  isAuthorizedFile,
  prepareFileExtensions,
} from '../helpers/fileUpload';
import {
  allowedFileExtensions,
  shapefileExtensions,
  shapefileMandatoryExtensions,
  SupportedGeoFileTypes,
  SupportedTabularFileTypes,
} from '../helpers/supportedFormats';
import { findCsvDelimiter, getDatasetInfo } from '../helpers/formatConversion';

// Stores
import { fileDropStore, setFileDropStore } from '../store/FileDropStore';
import { setGlobalStore } from '../store/GlobalStore';
import { setMapStore } from '../store/MapStore';
import { setModalStore } from '../store/ModalStore';

// Other components
import SimplificationModal from './Modals/SimplificationModal.tsx';

// Styles
import '../styles/ImportWindow.css';
import { openLayerManager } from './LeftMenu/LeftMenu.tsx';
import InformationBanner from './InformationBanner.tsx';

interface LayerOrTableDescription {
  name: string,
  features: number,
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
  type: 'tabular' | 'geo',
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

// const analyseDatasetGeoJSON = (
//   content: string,
//   name: string,
// ): DatasetInformation | InvalidDataset => {
//   const obj = JSON.parse(content);
//   return {
//     type: 'geo',
//     name,
//     detailedType: SupportedGeoFileTypes.GeoJSON,
//     complete: true,
//     layers: [
//       {
//         name,
//         features: obj.features.length,
//         geometryType: obj.features[0]?.geometry?.type || 'unknown',
//         crs: { // TODO: read layer with gdal and detect CRS if any
//           name: 'WGS 84',
//           code: 'ESPG:4326',
//         },
//         addToProject: true,
//         useCRS: false,
//         simplify: false,
//         fitMap: false,
//       },
//     ],
//   };
// };
// const analyseDatasetShapefile = async (
//   files: FileEntry[],
// ): Promise<DatasetInformation | InvalidDataset> => {
//   const result = await getDatasetInfo(files.map((f) => f.file));
//
//   const name = splitLastOccurrence(files[0].name, '.')[0];
//
//   return {
//     type: 'geo',
//     name,
//     detailedType: SupportedGeoFileTypes.Shapefile,
//     complete: true,
//     layers: [
//       {
//         name: result.layers[0].name,
//         features: result.layers[0].featureCount,
//         geometryType: result.layers[0].geometryFields[0]
//           ? result.layers[0].geometryFields[0].type : 'unknown',
//         crs: readCrs(result.layers[0].geometryFields[0]),
//         addToProject: true,
//         useCRS: false,
//         simplify: false,
//         fitMap: false,
//       },
//     ],
//   };
// };

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
    type: 'tabular',
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

  const layers = result.layers.map((layer: any) => ({
    name: layer.name,
    features: layer.featureCount,
    geometryType: layer.geometryFields[0] ? layer.geometryFields[0].type : 'unknown',
    crs: readCrs(layer.geometryFields[0]),
    useCRS: false,
    addToProject: true,
    simplify: false,
    fitMap: false,
  }));

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
    type: 'geo',
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
    type: 'geo',
    name,
    detailedType: SupportedGeoFileTypes.TopoJSON,
    complete: true,
    layers: Object.keys(obj.objects).map((layerName) => ({
      name: layerName,
      features: obj.objects[layerName].geometries.length,
      geometryType: obj.objects[layerName].geometries[0]?.type || 'unknown',
      crs: {
        name: 'WGS 84',
        code: 'ESPG:4326',
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
    type: 'tabular',
    name,
    detailedType: SupportedTabularFileTypes.JSON,
    complete: true,
    layers: [
      {
        name,
        features: obj.length,
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
    type: 'tabular',
    name,
    detailedType,
    complete: true,
    layers: [
      {
        name,
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
      if (content.includes('"FeatureCollection"')) {
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
        type: 'geo',
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
        type: 'geo',
        name,
        detailedType: SupportedGeoFileTypes.Shapefile,
        complete: false,
        layers: [],
      };
    } else {
      result = await analyseGeospatialDatasetGDAL(ds[name].files);
      console.log(result);
    }
  }

  return result as DatasetInformation;
};

const groupFiles = (
  files: CustomFileList,
): { [key: string]: { name: string, files: FileEntry[] } } => {
  // We want to group the files by their name (because shapefiles have multiple files)
  // but other files have only one file
  const groupedFiles: { [key: string]: { name: string, files: FileEntry[] } } = {};
  files.forEach((file) => {
    if (groupedFiles[file.name] === undefined) {
      groupedFiles[file.name] = {
        name: file.name,
        files: [file],
      };
    } else {
      if (
        groupedFiles[file.name].files.some((f) => (
          f.name === file.name
          && f.ext === file.ext
          && f.file.size === file.file.size
          && f.file.lastModified === file.file.lastModified))
      ) {
        return;
      }
      groupedFiles[file.name].files.push(file);
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
      // TODO: the following code could be put in a function
      //       as there is some code duplication with the drop handler in AppPage.tsx
      const theFiles = prepareFileExtensions((event.target as HTMLInputElement).files!);
      const filteredFiles = [];

      if (theFiles) {
        for (let i = 0; i < theFiles.length; i += 1) {
          if (isAuthorizedFile(theFiles[i])) {
            filteredFiles.push(theFiles[i]);
          } else {
            toast.error(LL().ImportWindow.UnsupportedFileFormat(`${theFiles[i].name}.${theFiles[i].ext}`));
          }
        }
        // Add the dropped files to the existing file list
        setFileDropStore(
          { files: fileDropStore.files.concat(filteredFiles) },
        );
      }
    };
    input.click();
  }

  // const groupedFiles = createMemo(() => groupFiles(overlayDropStore.files));
  const droppedFiles = createMemo(() => fileDropStore.files);

  const [fileDescriptions] = createResource<any, any>(
    droppedFiles,
    async () => {
      const groupedFiles = groupFiles(droppedFiles());
      return createMutable((await Promise.all(
        Object.keys(groupedFiles)
          .map(async (fileName) => {
            // Use existing description if available
            if (
              fileDescriptions()
                .find((f: DatasetDescription) => f.name === fileName && f.info && f.info.complete)
            ) {
              return fileDescriptions().find((f: DatasetDescription) => f.name === fileName);
            }

            const dsInfo = await analyzeDataset({ [fileName]: groupedFiles[fileName] });
            if ('valid' in dsInfo && dsInfo.valid === false) {
              // We have an invalid dataset that we don't wan't to add to the list
              toast.error(LL().ImportWindow.ErrorReadingFile({
                file: fileName,
                message: (dsInfo as InvalidDataset).reason,
              }));
              // TODO: we should also remove it from the fileDropStore
              return null;
            }
            return {
              ...groupedFiles[fileName],
              info: dsInfo as DatasetInformation,
            } as DatasetDescription;
          }),
      )).filter((f) => f !== null));
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
  const handleCheckUnique = (layer: LayerOrTableDescription, prop: 'fitMap' | 'useCRS') => {
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

  return <div class="modal-window modal overlay-drop" style={{ display: 'flex' }} ref={refParentNode!}>
    <div class="modal-background"></div>
    <div
      class="modal-card"
      style={{ width: '80vw', height: '80vh' }}
    >
      <section class="modal-card-body">
        <h2>{ LL().ImportWindow.Title() }</h2>
        <p
          class="is-clickable is-medium"
          style={{ 'text-decoration': 'underline' }}
          onClick={handleInputFiles} // eslint-disable-line no-empty-function
        >
          { LL().ImportWindow.Instructions() }
        </p>
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
                    <td>
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
                          if (fileDescription.info.type === 'geo') {
                            return <tr class="entry-detail">
                              <td>
                                <input
                                  type="checkbox"
                                  checked={layer.addToProject}
                                  onClick={() => {
                                    // eslint-disable-next-line no-param-reassign
                                    layer.addToProject = !layer.addToProject;
                                  }}
                                /></td>
                              <td>↳ {layer.name}</td>
                              <td>{layer.features} features</td>
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
                                onClick={() => {
                                  // eslint-disable-next-line no-param-reassign
                                  layer.addToProject = !layer.addToProject;
                                }}
                              /></td>
                            <td>↳ {layer.name}</td>
                            <td>{layer.features} features</td>
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
      <InformationBanner>
        <p>{LL().ImportWindow.SupportedVectorFormats()}</p>
        <p>{LL().ImportWindow.SupportedTabularFormats()}</p>
      </InformationBanner>
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
                  value: crsToUse.wkt,
                  bounds: crsToUse.bounds,
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
                    [ds.files, ds.info.detailedType, l.name, l.fitMap, l.simplify] as never[],
                  );
                }
              }));
            }));

            // TODO: if we only import one layer and if there wasn't any layer in the project,
            //  we should probably still automatically fit the map to the extent of the layer...
            //  (maybe we could also display a toast saying
            //  "The map has been fitted to the extent of the layer")
            for (let i = 0; i < dsToImport.length; i += 1) {
              const [files, type, name, fitMap, simplify] = dsToImport[i];
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
                  type,
                  name,
                  fitMap,
                  shouldBeVisible,
                );

                // If there are empty features, we display a toast to
                // inform the user about it.
                if (nRemoved > 0) {
                  toast.error(LL().ImportWindow.RemovedEmptyFeatures(nRemoved));
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

            // Remove the "loading" overlay
            setGlobalStore({ isLoading: false });

            // Open the layer manager section on the left menu
            openLayerManager();

            // The layers are loaded and the loading overlay is removed,
            // we can now display the simplification modal if needed.
            if (dsToSimplify.length > 0) {
              setModalStore({
                show: true,
                title: LL().SimplificationModal.title(),
                content: () => <SimplificationModal ids={dsToSimplify} />,
                width: '60vw',
              });
            }
          }}
        > { LL().ImportWindow.ImportButton(countLayerToImport(fileDescriptions())) }
        </button>
        <button
          class="button cancel-button"
          onClick={() => {
            // Remove the "drop" overlay
            setFileDropStore({ show: false, files: [] });
          }}
        > { LL().ImportWindow.CancelButton() }
        </button>
      </footer>
    </div>
  </div>;
}
