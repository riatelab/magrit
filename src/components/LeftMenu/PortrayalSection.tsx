import { JSX, Show, createSignal } from 'solid-js';
import { useI18nContext } from '../../i18n/i18n-solid';

import { layersDescriptionStore } from '../../store/LayersDescriptionStore';
import DropdownMenu from '../DropdownMenu.tsx';

function layerAvailableVariables(layerId: string) {
  const layer = layersDescriptionStore.layers.find((l) => l.id === layerId);

  const hasCategorical = layer.fields.some((f) => f.type === 'categorical');
  const hasStock = layer.fields.some((f) => f.type === 'stock');
  const hasRatio = layer.fields.some((f) => f.type === 'ratio');
  const hasIdentifier = layer.fields.some((f) => f.type === 'identifier');
  // const hasUnknown = layer.fields.some((f) => f.type === 'unknown');

  return {
    hasCategorical,
    hasStock,
    hasRatio,
    hasIdentifier,
    // hasUnknown,
  };
}

export default function PortrayalSection(): JSX.Element {
  const { LL } = useI18nContext();
  const [targetLayer, setTargetLayer] = createSignal(null);
  const [availableVariables, setAvailableVariables] = createSignal(null);

  return <div class="portrayal-section">
    <DropdownMenu
      entries={
        layersDescriptionStore.layers
          .map((layer) => ({ name: layer.name, value: layer.id }))}
      defaultEntry={ { name: LL().PortrayalSection.TargetLayer() } }
      onChange={ (value) => {
        setTargetLayer(value);
        setAvailableVariables(layerAvailableVariables(targetLayer()));
      } }
    />
    <div class="portrayal-section__portrayal-selection">
      <ul>
        <li classList={{ 'is-hidden': !availableVariables()?.hasRatio }}>Choropleth</li>
        <li classList={{ 'is-hidden': !availableVariables()?.hasStock }}>PropSymbols</li>
        <li classList={{ 'is-hidden': !availableVariables()?.hasIdentifier }}>Fooo</li>
        <li classList={{ 'is-hidden': !availableVariables()?.hasCategorical }}>Baar</li>
      </ul>
    </div>
    <div class="portrayal-section__portrayal-options">
      <Show when={ true }>
        <div>
          Field
        </div>
        <div>
          Discrétisation
        </div>
        <div>
          Color palette
        </div>
      </Show>
    </div>
  </div>;
}
