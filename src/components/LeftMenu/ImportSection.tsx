// Imports from solid-js
import { type JSX } from 'solid-js';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';

// Stores
import { setDatasetCatalogStore } from '../../store/DatasetCatalogStore';
import { setFileDropStore } from '../../store/FileDropStore';

export default function ImportSection(): JSX.Element {
  const { LL } = useI18nContext();

  return <div class="import-section" style={{ 'text-align': 'center' }}>
    <div>
      <a
        class="button is-primary is-outlined"
        style={{ width: '200px' }}
        onClick={() => { setFileDropStore({ show: true }); }}
      >
        { LL().ImportSection.OpenImportWindow() }
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
