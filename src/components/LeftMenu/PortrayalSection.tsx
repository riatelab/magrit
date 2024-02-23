import {
  createMemo,
  For,
  type JSX,
} from 'solid-js';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { isCandidateForRepresentation } from '../../helpers/layerDescription';

// Stores
import { layersDescriptionStore } from '../../store/LayersDescriptionStore';
import { portrayalSelectionStore, setPortrayalSelectionStore } from '../../store/PortrayalSelectionStore';

export default function PortrayalSection(): JSX.Element {
  const { LL } = useI18nContext();

  const entries = createMemo(() => layersDescriptionStore.layers
    .filter(isCandidateForRepresentation)
    .map((layer) => ({ name: layer.name, value: layer.id })));

  return <div class="portrayal-section">
    <div class="select" style={{ width: '100%' }}>
      <select
        style={{ width: '100%' }}
        value={portrayalSelectionStore.layerId}
        onChange={(e) => {
          const v = e.currentTarget.value;
          if (v === '') {
            setPortrayalSelectionStore({
              show: false,
              layerId: '',
            });
          } else {
            setPortrayalSelectionStore({
              show: true,
              layerId: v,
            });
          }
        }}
      >
        <option value="">{ LL().PortrayalSection.TargetLayer() }</option>
        <For each={entries()}>
          {
            (entry) => (
              <option value={entry.value}>{entry.name}</option>
            )
          }
        </For>
      </select>
    </div>
  </div>;
}
