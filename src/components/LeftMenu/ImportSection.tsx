// Imports from solid-js
import { type JSX } from 'solid-js';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { convertAndAddFiles, prepareFileExtensions } from '../../helpers/fileUpload';

// Stores
import { setDatasetCatalogStore } from '../../store/DatasetCatalogStore';

enum FileType {
  Geospatial = 0,
  Tabular = 1,
}

const acceptedFileTypes = [
  '.geojson, .shp, .dbf, .cpg, .prj, .shx, .csv, .kml, .gml, .zip, .gpkg', // GeoSpatial
  '.csv, .tsv, .xls, .xlsx, .ods', // Tabular
];

export default function ImportSection(): JSX.Element {
  const { LL } = useI18nContext();

  function handleInputFiles(fileType: FileType) {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', acceptedFileTypes[fileType]);
    if (fileType === FileType.Geospatial) {
      input.setAttribute('multiple', '');
    }
    input.onchange = async (event) => {
      const { files: theFiles } = (event.target as HTMLInputElement);
      if (theFiles) {
        const files = prepareFileExtensions(theFiles);
        await convertAndAddFiles(files);
      }
    };
    input.click();
  }

  return <div class="import-section" style={{ 'text-align': 'center' }}>
    <div>
      <a
        class="button is-primary is-outlined"
        style={{ width: '200px' }}
        onClick={() => { handleInputFiles(FileType.Geospatial); }}
      >
        { LL().ImportSection.OpenGeospatialFile() }
      </a>
    </div>
    <div>
      <a
        class="button is-primary is-outlined"
        style={{ width: '200px' }}
        onClick={() => { handleInputFiles(FileType.Tabular); }}
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
