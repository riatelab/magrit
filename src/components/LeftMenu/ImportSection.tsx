import {
  createSignal, JSX, Show,
} from 'solid-js';
import { useI18nContext } from '../../i18n/i18n-solid';

export default function ImportSection(): JSX.Element {
  const { LL } = useI18nContext();

  return <div class="import-section">
    <div>
      { LL().ImportSection.OpenGeospatialFile() }
    </div>
    <div>
      { LL().ImportSection.OpenTabularFile() }
    </div>
    <div>
      <a
        class="button is-primary is-outlined"
        onClick={() => {}}
      >
        { LL().ImportSection.ExampleDatasets() }
      </a>
    </div>
  </div>;
}
