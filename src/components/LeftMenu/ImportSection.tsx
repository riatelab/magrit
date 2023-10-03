// Imports from solid-js
import {
  createSignal, JSX, Show,
} from 'solid-js';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';

// Stores
import { setDatasetCatalogStore } from '../../store/DatasetCatalogStore';

enum FileType {
  Geospatial = 0,
  Tabular = 1,
}

const acceptedFileTypes = [
  '.geojson, .shp, .dbf, .cpg, .prj, .shx, .csv, .kml, .gml, .zip, .gpkg', // GeoSpatial
  '.csv, .xls, .xlsx, .ods', // Tabular
];

export default function ImportSection(): JSX.Element {
  const { LL } = useI18nContext();
  const [
    geoFiles,
    setGeoFiles,
  ] = createSignal<FileList | null>(null);

  const [
    tabularFiles,
    setTabularFiles,
  ] = createSignal<FileList | null>(null);

  function createInputFile(fileType: FileType) {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', acceptedFileTypes[fileType]);
    if (fileType === FileType.Geospatial) {
      input.setAttribute('multiple', '');
    }
    input.onchange = (event) => {
      const { files: theFiles } = (event.target as HTMLInputElement);
      if (theFiles) {
        console.log(theFiles);
        if (fileType === FileType.Geospatial) {
          setGeoFiles(theFiles);
        } else if (fileType === FileType.Tabular) {
          setTabularFiles(theFiles);
        }
      }
    };
    input.click();
  }

  return <div class="import-section" style={{ 'text-align': 'center' }}>
    <div>
      <a
        class="button is-primary is-outlined"
        style={{ width: '200px' }}
        onClick={() => { createInputFile(FileType.Geospatial); }}
      >
        { LL().ImportSection.OpenGeospatialFile() }
      </a>
    </div>
    <div>
      <a
        class="button is-primary is-outlined"
        style={{ width: '200px' }}
        onClick={() => { createInputFile(FileType.Tabular); }}
      >
        { LL().ImportSection.OpenTabularFile() }
      </a>
    </div>
    <div>
      <a
        class="button is-primary is-outlined"
        style={{ width: '200px' }}
        onClick={() => { setDatasetCatalogStore({ show: true }); }}
      >
        { LL().ImportSection.ExampleDatasets() }
      </a>
    </div>
  </div>;
}
