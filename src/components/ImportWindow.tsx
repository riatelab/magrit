import {
  createMemo,
  createResource,
  createSignal,
  For,
  JSX,
  Show,
} from 'solid-js';

import { FaSolidTrashCan } from 'solid-icons/fa';
import { VsTriangleDown, VsTriangleRight } from 'solid-icons/vs';
import d3 from '../helpers/d3-custom';

import { overlayDropStore } from '../store/OverlayDropStore';

import { CustomFileList, FileEntry } from '../helpers/fileUpload';
import { SupportedGeoFileTypes, SupportedTabularFileTypes } from '../helpers/supportedFormats';
import { findCsvDelimiter } from '../helpers/formatConversion';

interface ItemDescription {
  name: string,
  features: number,
  geometryType?: 'point' | 'line' | 'polygon' | 'unknown',
  delimiter?: string,
}

interface DatasetInformation {
  name: string,
  type: 'tabular' | 'geo',
  detailedType: SupportedGeoFileTypes | SupportedTabularFileTypes,
  complete: boolean,
  layers: ItemDescription[],
}

interface InvalidDataset {
  name: string,
  valid: boolean,
  reason: string,
}

const analyseDatasetGeoJSON = (
  content: string,
  name: string,
): DatasetInformation | InvalidDataset => {
  const obj = JSON.parse(content);
  return {
    type: 'geo',
    name,
    detailedType: SupportedGeoFileTypes.GeoJSON,
    complete: true,
    layers: [
      {
        name,
        features: obj.features.length,
        geometryType: obj.features[0]?.geometry?.type || 'unknown',
      },
    ],
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
      },
    ],
  };
};

const analyseDatasetTabularText = (
  content: string,
  name: string,
): DatasetInformation | InvalidDataset => {
  const delimiter = findCsvDelimiter(content);
  const ds = d3.dsvFormat(delimiter).parse(content);
  return {
    name,
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
  console.log(ds[name].files);
  // Determine the type of the dataset
  if (ds[name].files.length === 1) {
    // Only one file
    const file = ds[name].files[0];
    console.log(file.file.type);
    if (file.file.type.includes('json') || file.ext.includes('json')) {
      // At this point we have a JSON file, it can be a GeoJSON or a TopoJSON or
      // tabular data or something else...
      // Read the file to determine the type
      const content = await file.file.text();
      if (content.includes('"FeatureCollection"')) {
        // We have a GeoJSON file
        result = analyseDatasetGeoJSON(content, name);
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
      result = analyseDatasetTabularText(content, name);
    }
  } else { // We have multiple files, so it's probably a shapefile

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

export default function ImportWindow(): JSX.Element {
  let refParentNode: HTMLDivElement;

  const [expanded, setExpanded] = createSignal<string[]>([]);

  const handleExpanded = (name: string) => () => {
    if (expanded().includes(name)) {
      setExpanded(expanded().filter((n) => n !== name));
    } else {
      setExpanded([...expanded(), name]);
    }
  };

  const groupedFiles = createMemo(() => groupFiles(overlayDropStore.files));

  const [fileDescriptions] = createResource(
    groupedFiles,
    async () => Promise.all(
      Object.keys(groupedFiles())
        .map(async (fileName) => analyzeDataset({ [fileName]: groupedFiles()[fileName] })),
    ),
  );

  return <div class="modal-window modal overlay-drop" style={{ display: 'flex' }} ref={refParentNode!}>
    <div class="modal-background"></div>
    <div
      class="modal-card"
      style={{ width: '80vw', height: '80vh' }}
    >
      <section class="modal-card-body">
        <h3>Import files</h3>
        <p>Drop other files if needed...</p>
        <table class="table">
          <thead>
            <Show when={expanded().length === 0}>
              <tr>
                <th></th>
                <th>Layer name</th>
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
                <th>Add to map</th>
                <th>Simplify</th>
                <th>Delete ?</th>
              </tr>
            </Show>
          </thead>
          <tbody>
            <For each={fileDescriptions()}>
              {
                (dsInfo: DatasetInformation) => <>
                  <tr class="entry-title">
                    <td>
                      <Show
                        when={expanded().includes(dsInfo.name)}
                        fallback={
                          <VsTriangleRight onClick={handleExpanded(dsInfo.name)} />
                        }
                      >
                        <VsTriangleDown onClick={handleExpanded(dsInfo.name)} />
                      </Show>
                    </td>
                    <td>{dsInfo.name}.{dsInfo.detailedType}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td><FaSolidTrashCan/></td>
                  </tr>
                  <Show when={expanded().includes(dsInfo.name)}>
                    <For each={dsInfo.layers}>
                      {
                        (layer) => {
                          if (dsInfo.type === 'geo') {
                            return <tr class="entry-detail" style={{ background: '#fafafa' }}>
                              <td></td>
                              <td>- {layer.name}</td>
                              <td>{layer.features} features</td>
                              <td>{layer.geometryType || 'None'}</td>
                              <td><input type="checkbox"/></td>
                              <td><input type="checkbox"/></td>
                              <td></td>
                            </tr>;
                          }
                          return <tr class="entry-detail" style={{ background: '#fafafa' }}>
                            <td></td>
                            <td>- {layer.name}</td>
                            <td>{layer.features} features</td>
                            <td>x</td>
                            <td><input type="checkbox"/></td>
                            <td><input type="checkbox"/></td>
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
              <tr><td>{ 'Loading' }</td></tr>
            </Show>
          </tbody>
        </table>
      </section>
    </div>
  </div>;
}
