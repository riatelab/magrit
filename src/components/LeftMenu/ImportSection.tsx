// Imports from solid-js
import { type JSX } from 'solid-js';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';

// Stores
import { setFileDropStore } from '../../store/FileDropStore';
import { setModalStore } from '../../store/ModalStore';

// Subcomponents
import ExampleDatasetModal from '../Modals/ExampleDatasetModal.tsx';

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
        }}
        onClick={() => { setFileDropStore({ show: true }); }}
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
            width: '90vw',
            successButton: LL().DatasetCatalog.confirmButton(),
            cancelButton: LL().DatasetCatalog.cancelButton(),
          });
        }}
        disabled={true}
      >
        { LL().ImportSection.ExampleDatasets() }
      </button>
    </div>
  </div>;
}
