import { createEffect, createMemo, For, JSX, on } from 'solid-js';
import { overlayDropStore } from '../store/OverlayDropStore';
import { CustomFileList, FileEntry } from '../helpers/fileUpload';
import { SupportedGeoFileTypes, SupportedTabularFileTypes } from '../helpers/supportedFormats';

interface ItemDescription {
  name: string,
  features: number,
  geometryType?: 'point' | 'line' | 'polygon' | 'unknown',
}

interface DatasetInformation {
  name: string,
  type: 'tabular' | 'geo',
  detailedType: SupportedGeoFileTypes | SupportedTabularFileTypes,
  complete: boolean,
  layers: ItemDescription[],
}

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
  const result: Partial<DatasetInformation> = {
    name,
  };
  // Determine the type of the dataset
  if (ds[name].files.length === 1) {
    // Only one file
    const file = ds[name].files[0];
    if (file.file.type === 'application/json') {
      // Read the file to determine the type
      const content = await file.file.text();
      if (content.includes('FeatureCollection')) {
        const obj = JSON.parse(content);
        result.type = 'geo';
        result.detailedType = SupportedGeoFileTypes.GeoJSON;
        result.complete = true;
        result.layers = [
          {
            name: file.name,
            features: obj.features.length,
            geometryType: obj.features[0]?.geometry?.type || 'unknown',
          },
        ];
      } else if (content.includes('Topology')) {
        result.type = 'geo';
        result.detailedType = SupportedGeoFileTypes.TopoJSON;
        result.complete = true;
        const obj = JSON.parse(content);
        result.layers = Object.keys(obj.objects).map((layerName) => ({
          name: layerName,
          features: obj.objects[layerName].geometries.length,
          geometryType: obj.objects[layerName].geometries[0]?.type || 'unknown',
        }));
      } else {
        console.log('Unhandled JSON file');
      }
    } else if (file.file.type === 'application/vnd.google-earth.kml+xml') {
      result.type = 'geo';
      result.detailedType = SupportedGeoFileTypes.KML;
      result.complete = true;
      result.layers = [
        {
          name: file.name,
          features: 0,
          geometryType: 'unknown',
        },
      ];
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
      console.log(file.file);
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
        console.log('File already exists');
        return;
      }
      groupedFiles[file.name].files.push(file);
    }
  });
  return groupedFiles;
};

export default function ImportWindow(): JSX.Element {
  let refParentNode: HTMLDivElement;

  const groupedFiles = createMemo(() => groupFiles(overlayDropStore.files));

  createEffect(
    on(
      () => overlayDropStore.files,
      async () => {
        const result = await analyzeDataset(groupedFiles());
        console.log(result);
      },
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
        <table class="table is-striped is-striped">
          <thead>
            <tr>
              <th>Layer name</th>
              <th>Features</th>
              <th>Geometry type</th>
              <th>Fit extent</th>
            </tr>
          </thead>
          <tbody>
            <For each={Object.keys(groupedFiles())}>
              {
                (fileName) => <tr>
                  <td>{fileName}</td>
                  <td>{groupedFiles()[fileName].files.length}</td>
                  <td>Point</td>
                  <td><input type="checkbox" /></td>
                </tr>
              }
            </For>
          </tbody>
        </table>
      </section>
    </div>
  </div>;
}
