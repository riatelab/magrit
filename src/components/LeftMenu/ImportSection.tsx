// Imports from solid-js
import { type JSX } from 'solid-js';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';

// Stores
import { setFileDropStore } from '../../store/FileDropStore';
import { setModalStore } from '../../store/ModalStore';

// Subcomponents
import ExampleDatasetModal from '../Modals/ExampleDatasetModal.tsx';
import { gdalLoaded } from './gdalLoadingStatus';

// Styles
import '../../styles/LeftMenu.css';

export default function ImportSection(): JSX.Element {
  const { LL } = useI18nContext();

  return <div class="import-section">
    <div>
      <button
        class="button is-primary is-outlined"
        style={{
          'border-bottom-left-radius': '0',
          'border-bottom-right-radius': '0',
          'border-bottom-width': '0',
          cursor: gdalLoaded() ? 'pointer' : 'not-allowed',
        }}
        onClick={() => { setFileDropStore({ show: true }); }}
        disabled={!gdalLoaded()}
        title={gdalLoaded() ? '' : LL().ImportSection.GdalNotLoaded()}
      >
        { LL().ImportSection.OpenImportWindow() }
      </button>
    </div>
    <div>
      <button
        class="button is-primary is-outlined"
        style={{
          'border-top-left-radius': '0',
          'border-top-right-radius': '0',
          'background-color': 'unset',
        }}
        onClick={() => {
          setModalStore({
            show: true,
            title: LL().DatasetCatalog.title(),
            content: () => <ExampleDatasetModal />,
            escapeKey: 'cancel',
            width: 'min(1700px, 95vw)',
            successButton: LL().DatasetCatalog.confirmButton(),
            cancelButton: LL().DatasetCatalog.cancelButton(),
          });
        }}
      >
        { LL().ImportSection.ExampleDatasets() }
      </button>
    </div>
  </div>;
}
