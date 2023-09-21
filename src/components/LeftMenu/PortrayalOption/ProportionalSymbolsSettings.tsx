import { JSX } from 'solid-js';
import { useI18nContext } from '../../../i18n/i18n-solid';

import { layersDescriptionStore } from '../../../store/LayersDescriptionStore';

interface ProportionalSymbolsSettingsProps {
  layerId: string;
}

export default function ProportionalSymbolsSettings(
  props: ProportionalSymbolsSettingsProps,
): JSX.Element {
  const { LL } = useI18nContext();

  const layerDescription = layersDescriptionStore.layers
    .find((l) => l.id === props.layerId);

  if (!layerDescription) {
    throw Error('Unexpected Error: Layer not found');
  }

  const targetFields = layerDescription
    .fields?.filter((variable) => variable.type === 'stock');

  if (!targetFields || targetFields.length === 0) {
    throw Error('Unexpected Error: No stock field found');
  }

  return <div class="portrayal-section__portrayal-options-proportional-symbols">
    <div class="field">
    </div>
  </div>;
}
