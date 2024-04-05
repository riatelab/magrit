// Imports from solid-js
import { type JSX } from 'solid-js';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';

// Stores
import { setFileDropStore } from '../../store/FileDropStore';
import { setModalStore } from '../../store/ModalStore';

// Subcomponents
import ExampleDatasetModal from '../Modals/ExampleDatasetModal.tsx';

export default function ImportSection(): JSX.Element {
  const { LL } = useI18nContext();

  return <div class="import-section" style={{ 'text-align': 'center' }}>
    <div>
      <button
        class="button is-primary is-outlined"
        style={{ width: '280px' }}
        onClick={() => { setFileDropStore({ show: true }); }}
      >
        { LL().ImportSection.OpenImportWindow() }
      </button>
    </div>
    <div>
      <button
        class="button is-primary is-outlined"
        style={{ width: '280px' }}
        onClick={() => {
          setModalStore({
            show: true,
            title: LL().DatasetCatalog.title(),
            content: () => <ExampleDatasetModal />,
            escapeKey: 'cancel',
            width: '90vw',
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
