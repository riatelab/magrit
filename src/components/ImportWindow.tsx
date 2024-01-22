import {
  createMemo,
  createResource,
  createSignal,
  For,
  JSX,
  Show,
} from 'solid-js';
import { createMutable } from 'solid-js/store';

import { FaSolidTrashCan } from 'solid-icons/fa';
import { VsTriangleDown, VsTriangleRight } from 'solid-icons/vs';
import d3 from '../helpers/d3-custom';

import { setGlobalStore } from '../store/GlobalStore';
import { setMapStore } from '../store/MapStore';
import { overlayDropStore, setOverlayDropStore } from '../store/OverlayDropStore';

import {
  convertAndAddFiles,
  CustomFileList,
  FileEntry,
} from '../helpers/fileUpload';
import {
  shapefileExtensions,
  shapefileMandatoryExtensions,
  SupportedGeoFileTypes,
  SupportedTabularFileTypes,
} from '../helpers/supportedFormats';
import { findCsvDelimiter, getDatasetInfo } from '../helpers/formatConversion';

import '../styles/ImportWindow.css';

interface LayerOrTableDescription {
  name: string,
  features: number,
  geometryType?: 'point' | 'line' | 'polygon' | 'unknown',
  crs?: {
    name: string,
    code?: string,
    wkt?: string,
  },
  delimiter?: string,
  addToProject: boolean,
  useCRS: boolean,
  simplify: boolean,
  fitMap: boolean,
}

interface DatasetInformation {
  name: string,
  type: 'tabular' | 'geo',
  detailedType: SupportedGeoFileTypes | SupportedTabularFileTypes,
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

const readCrs = (geomColumn: any) => {
  if (
    geomColumn.coordinateSystem?.projjson?.id?.code
    && geomColumn.coordinateSystem?.projjson?.id?.authority
  ) {
    return {
      name: geomColumn.coordinateSystem?.projjson?.name,
      code: `${geomColumn.coordinateSystem.projjson.id.authority}:${geomColumn.coordinateSystem.projjson.id.code}`,
      wkt: geomColumn.coordinateSystem?.wkt,
    };
  }
  return {
    name: geomColumn.coordinateSystem?.projjson?.name,
    code: undefined,
    wkt: geomColumn.coordinateSystem?.wkt,
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
//   // console.log(result);
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

const analyseDatasetGDAL = async (
  fileOrFiles: FileEntry | FileEntry[],
): Promise<DatasetInformation | InvalidDataset> => {
  const ds = Array.isArray(fileOrFiles)
    ? fileOrFiles.map((fe) => fe.file)
    : fileOrFiles.file;
  const name = Array.isArray(fileOrFiles)
    ? fileOrFiles[0].name
    : fileOrFiles.name;
  const result = await getDatasetInfo(ds);
  console.log(result);
  const layers = result.layers.map((layer) => ({
    name: layer.name,
    features: layer.featureCount,
    geometryType: layer.geometryFields[0] ? layer.geometryFields[0].type : 'unknown',
    crs: readCrs(layer.geometryFields[0]),
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
      },
      addToProject: true,
      simplify: false,
      fitMap: false,
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
  ext: 'csv' | 'tsv',
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
): Promise<DatasetInformation> => {
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
        result = await analyseDatasetGDAL(file);
      } else if (content.includes('"Topology"')) {
        // We have a TopoJSON file
        result = analyzeDatasetTopoJSON(content, name);
        console.log(result);
      } else {
        // We have a JSON file but it's not a GeoJSON or a TopoJSON
        // So it's probably tabular data.
        result = analyseDatasetTabularJSON(content, name);
      }
    } else if (file.file.type.includes('text/') || ['tsv', 'csv', 'txt'].includes(file.ext)) {
      // We have a text file, it can be a CSV or a TSV or something else...
      // Read the file to determine the type
      const content = await file.file.text();
      result = analyseDatasetTabularText(content, name, file.ext);
    } else if (
      file.file.type === 'application/vnd.ms-excel'
      || file.file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      // result = analyseDatasetTabularText(content, name, file.ext);
    } else if (
      file.file.type === 'application/geopackage+sqlite3'
      || file.file.type === 'application/gml+xml'
      || file.file.type === 'application/vnd.google-earth.kml+xml'
      // TODO: handle zip files...
    ) {
      result = await analyseDatasetGDAL(file);
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
      result = await analyseDatasetGDAL(ds[name].files);
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
  let refParentNode: HTMLDivElement;

  // const groupedFiles = createMemo(() => groupFiles(overlayDropStore.files));
  const droppedFiles = createMemo(() => overlayDropStore.files);

  const [fileDescriptions] = createResource<any, any>(
    droppedFiles,
    async () => {
      const groupedFiles = groupFiles(droppedFiles());
      return createMutable(await Promise.all(
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

            return {
              ...groupedFiles[fileName],
              info: dsInfo,
            } as DatasetDescription;
          }),
      ));
    },
  );

  const [expanded, setExpanded] = createSignal<string[]>([]);

  const handleExpanded = (name: string) => () => {
    if (expanded().includes(name)) {
      setExpanded(expanded().filter((n) => n !== name));
    } else {
      setExpanded([...expanded(), name]);
    }
  };

  const handleCheckFitMap = (layer: LayerOrTableDescription) => {
    const newCheckedState = !layer.fitMap;
    if (newCheckedState) {
      // Remove the checked state of the other datasets
      fileDescriptions().forEach((f: DatasetDescription) => {
        f.info.layers.forEach((l: LayerOrTableDescription) => {
          // eslint-disable-next-line no-param-reassign
          l.fitMap = false;
        });
      });
    }
    // eslint-disable-next-line no-param-reassign
    layer.fitMap = !layer.fitMap;
  };

  return <div class="modal-window modal overlay-drop" style={{ display: 'flex' }} ref={refParentNode!}>
    <div class="modal-background"></div>
    <div
      class="modal-card"
      style={{ width: '80vw', height: '80vh' }}
    >
      <section class="modal-card-body">
        <h3>Import files</h3>
        <p>Drop other files if needed...</p>
        <table class="table file-import-table">
          <thead>
            <Show when={expanded().length === 0}>
              <tr>
                <th></th>
                <th>Layer name</th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th>Delete ?</th>
              </tr>
            </Show>
            <Show when={expanded().length > 0}>
              <tr>
                <th></th>
                <th>Layer name</th>
                <th>Features</th>
                <th>Geometry type</th>
                <th>CRS</th>
                <th>Add to project</th>
                <th>Use projection</th>
                <th>Simplify</th>
                <th>Fit map to extent</th>
                <th>Delete</th>
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
                        when={expanded().includes(fileDescription.info.name)}
                        fallback={
                          <VsTriangleRight class="is-clickable" onClick={handleExpanded(fileDescription.info.name)}/>
                        }
                      >
                        <VsTriangleDown class="is-clickable" onClick={handleExpanded(fileDescription.info.name)}/>
                      </Show>
                    </td>
                    <td>
                      {fileDescription.info.name}
                      .{formatFileExtension(fileDescription.files.map((f) => f.ext))}
                      <Show when={!fileDescription.info.complete}>
                        <span class="tag is-warning ml-3" style={{ 'vertical-align': 'top' }}>
                          Incomplete
                        </span>
                      </Show>
                    </td>
                    <td></td>
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
                          setOverlayDropStore(
                            'files',
                            overlayDropStore.files
                              .filter((f) => f.name !== fileDescription.info.name),
                          );
                          if (expanded().includes(fileDescription.info.name)) {
                            setExpanded(expanded().filter((n) => n !== fileDescription.info.name));
                          }
                        }}
                      />
                    </td>
                  </tr>
                  <Show when={expanded().includes(fileDescription.info.name)}>
                    <For each={fileDescription.info.layers}>
                      {
                        (layer) => {
                          if (fileDescription.info.type === 'geo') {
                            return <tr class="entry-detail">
                              <td></td>
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
                                  checked={layer.addToProject}
                                  onClick={() => {
                                    // eslint-disable-next-line no-param-reassign
                                    layer.addToProject = !layer.addToProject;
                                  }}
                                /></td>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={layer.useCRS}
                                  onClick={() => {
                                    // eslint-disable-next-line no-param-reassign
                                    layer.useCRS = !layer.useCRS;
                                  }}
                                /></td>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={layer.simplify}
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
                                  onClick={() => handleCheckFitMap(layer)}
                                />
                              </td>
                              <td></td>
                            </tr>;
                          }
                          return <tr class="entry-detail">
                            <td></td>
                            <td>↳ {layer.name}</td>
                            <td>{layer.features} features</td>
                            <td><i>NA</i></td>
                            <td><i>NA</i></td>
                            <td>
                              <input
                                type="checkbox"
                                checked={layer.addToProject}
                                onClick={() => {
                                  // eslint-disable-next-line no-param-reassign
                                  layer.addToProject = !layer.addToProject;
                                }}
                              /></td>
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
                <td>{'Loading'}</td>
              </tr>
            </Show>
          </tbody>
        </table>
      </section>
      <footer class="modal-card-foot">
        <button
          disabled={fileDescriptions.loading || droppedFiles().length === 0}
          class="button is-success confirm-button"
          onClick={async () => {
            // Remove the "drop" overlay
            setOverlayDropStore({ show: false, files: [] });
            // Add the "loading" overlay
            setGlobalStore({ isLoading: true });
            // Do we have to use a specific CRS ?
            let crsToUse: object | undefined;
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
                { // TODO: improve compatibility between CRS description from GDAL
                  //       and the one used in the mapStore
                  type: 'proj4',
                  name: crsToUse.name,
                  value: crsToUse.code,
                  // bounds: selectedProjection()!.bbox,
                },
              );
            }
            // Import the selected datasets
            await Promise.all(fileDescriptions().map(async (ds: DatasetDescription) => {
              await Promise.all(ds.info.layers.map(async (l: LayerOrTableDescription) => {
                if (l.addToProject) {
                  await convertAndAddFiles(
                    ds.files,
                    ds.info.detailedType,
                    l.name,
                    l.fitMap,
                  );
                }
              }));
            }));
            // Remove the "loading" overlay
            setGlobalStore({ isLoading: false });
          }}
        >Import selected datasets
        </button>
        <button
          class="button cancel-button"
          onClick={() => {
          }}
        >Cancel
        </button>
      </footer>
    </div>
  </div>;
}
