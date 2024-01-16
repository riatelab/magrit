// Imports from solid-js
import { type JSX, Show } from 'solid-js';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';

// Stores
import { setDatasetCatalogStore } from '../../store/DatasetCatalogStore';

/*
* In this Wizard the user will be able to:
* - Choose the name of the dataset
* - Choose if the dataset has a spatial component
*   (such as X/Y columns or a geometry columns with geometry in WKT)
* - Choose the delimiter (amonst a list of possible delimiters or a custom one)
* - Choose the encoding (amongst a list of possible encodings or a custom one)
*/

export default function TabularImportWizardModal(): JSX.Element {
  const { LL } = useI18nContext();

  return <div class="modal-window modal" style={{ display: 'flex' }}>
    <div class="modal-background"></div>
    <div class="modal-card" style={{ width: '90vw', height: '90vh' }}>
      <header class="modal-card-head">
        <p class="modal-card-title">{ LL().DatasetCatalog.title() }</p>
      </header>
      <section class="modal-card-body" style={{ display: 'flex' }}>
      </section>
      <footer class="modal-card-foot">
        <button
          class="button is-success confirm-button"
          onClick={() => setDatasetCatalogStore({ show: false })}
        >
          { LL().DatasetCatalog.confirmButton() }
        </button>
        <button
          class="button cancel-button"
          onClick={() => setDatasetCatalogStore({ show: false })}
        >
          { LL().DatasetCatalog.cancelButton() }
        </button>
      </footer>
    </div>
  </div>;
}
