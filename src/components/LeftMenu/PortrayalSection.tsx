import { JSX, Show, createSignal } from 'solid-js';
import { useI18nContext } from '../../i18n/i18n-solid';

import { layersDescriptionStore } from '../../store/LayersDescriptionStore';
import DropdownMenu from '../DropdownMenu.tsx';

import '../../styles/PortrayalSection.css';

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

function onClickPortrayal(event: Event) {
  // Remove the selected class on all other elements
  const selectedElement = document
    .querySelector('.portrayal-section__portrayal-selection li.selected');

  if (selectedElement) {
    selectedElement.classList.remove('selected');
  }

  const target = event.currentTarget as HTMLElement;
  target.classList.add('selected');
}

export default function PortrayalSection(): JSX.Element {
  const { LL } = useI18nContext();

  const [targetLayer, setTargetLayer] = createSignal(null);
  const [availableVariables, setAvailableVariables] = createSignal(null);
  const [selectedPortrayal, setSelectedPortrayal] = createSignal(null);

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
        <li
          onClick={ (ev) => { onClickPortrayal(ev); setSelectedPortrayal('choropleth'); } }
          classList={{ 'is-hidden': !availableVariables()?.hasRatio }}
        >
          Choropleth
        </li>
        <li
          onClick={ (ev) => { onClickPortrayal(ev); setSelectedPortrayal('propsymbols'); } }
          classList={{ 'is-hidden': !availableVariables()?.hasStock }}
        >
          PropSymbols
        </li>
        <li
          onClick={ (ev) => { onClickPortrayal(ev); setSelectedPortrayal('foo'); } }
          classList={{ 'is-hidden': !availableVariables()?.hasIdentifier }}
        >
          Fooo
        </li>
        <li
          onClick={ (ev) => { onClickPortrayal(ev); setSelectedPortrayal('bar'); } }
          classList={{ 'is-hidden': !availableVariables()?.hasCategorical }}
        >
          Baar
        </li>
      </ul>
    </div>
    <div class="portrayal-section__portrayal-options">
      <Show when={ selectedPortrayal() === 'choropleth' }>
        <div class="portrayal-section__portrayal-options-choropleth">
          <div>
            Field
          </div>
          <div>
            Discrétisation
          </div>
          <div>
            Color palette
          </div>
        </div>
      </Show>
      <Show when={ selectedPortrayal() === 'propsymbols' }>
        <div class="portrayal-section__portrayal-options-choropleth">
          <div>
            Field
          </div>
          <div>
            Radius
          </div>
          <div>
            Valeur max
          </div>
        </div>
      </Show>
      <Show when={ selectedPortrayal() === 'foo' }>
        <div class="portrayal-section__portrayal-options-choropleth">
          <div>
            Foooo
          </div>
          <div>
            Fooo
          </div>
          <div>
            Foo
          </div>
        </div>
      </Show>
    </div>
    <div>
      <Show when={ selectedPortrayal() !== null }>
        <button class="button is-success">
          { LL().PortrayalSection.CreateLayer() }
        </button>
      </Show>
    </div>
  </div>;
}
