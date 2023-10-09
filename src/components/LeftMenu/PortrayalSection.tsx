import {
  JSX,
  Show,
  createSignal, onMount,
} from 'solid-js';
import { useI18nContext } from '../../i18n/i18n-solid';

import { layersDescriptionStore } from '../../store/LayersDescriptionStore';

import { isCandidateForRepresentation } from '../../helpers/layerDescription';

import DropdownMenu from '../DropdownMenu.tsx';
import ChoroplethSettings from './PortrayalOption/ChoroplethSettings.tsx';

import '../../styles/PortrayalSection.css';
import ProportionalSymbolsSettings from './PortrayalOption/ProportionalSymbolsSettings.tsx';

function layerAvailableVariables(layerId: string) {
  const layer = layersDescriptionStore.layers
    .find((l) => l.id === layerId);

  if (!layer || !layer.fields) {
    return {
      hasCategorical: false,
      hasStock: false,
      hasRatio: false,
      hasIdentifier: false,
    };
  }

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

  const [
    targetLayer,
    setTargetLayer,
  ] = createSignal<string | null>(null);
  const [
    availableVariables,
    setAvailableVariables,
  ] = createSignal<string | null>(null);
  const [
    selectedPortrayal,
    setSelectedPortrayal,
  ] = createSignal<string | null>(null);

  onMount(() => { console.log('PortrayalSection mounted'); });

  // Todo: this should be reactive instead of unmounting
  //   in "LeftMenu"
  return <div class="portrayal-section">
    <DropdownMenu
      id={'portrayal-section__portrayal-dropdown'}
      entries={
        layersDescriptionStore.layers
          .filter(isCandidateForRepresentation)
          .map((layer) => ({ name: layer.name, value: layer.id }))}
      defaultEntry={ { name: LL().PortrayalSection.TargetLayer() } }
      onChange={ (value) => {
        // Deselect the portrayal selected if any
        setSelectedPortrayal(null);
        // Set the target layer...
        setTargetLayer(value);
        // ...and compute the available portrayals for the variable of this layer
        setAvailableVariables(layerAvailableVariables(targetLayer()));
      } }
    />
    <div class="portrayal-section__portrayal-selection">
      <ul>
        <li
          onClick={ () => { setSelectedPortrayal('choropleth'); } }
          classList={{ 'is-hidden': !availableVariables()?.hasRatio, selected: selectedPortrayal() === 'choropleth' }}
        >
          { LL().PortrayalSection.PortrayalTypes.Choropleth() }
        </li>
        <li
          onClick={ () => { setSelectedPortrayal('propsymbols'); } }
          classList={{ 'is-hidden': !availableVariables()?.hasStock, selected: selectedPortrayal() === 'propsymbols' }}
        >
          { LL().PortrayalSection.PortrayalTypes.ProportionalSymbols() }
        </li>
        <li
          onClick={ () => { setSelectedPortrayal('foo'); } }
          classList={{ 'is-hidden': !availableVariables()?.hasIdentifier, selected: selectedPortrayal() === 'foo' }}
        >
          Fooo
        </li>
        <li
          onClick={ () => { setSelectedPortrayal('bar'); } }
          classList={{ 'is-hidden': !availableVariables()?.hasCategorical, selected: selectedPortrayal() === 'bar' }}
        >
          Baar
        </li>
      </ul>
      <Show when={
        availableVariables()
        && !availableVariables()?.hasRatio
        && !availableVariables()?.hasStock
        && !availableVariables()?.hasCategorical
      }>
        <p><i>{ LL().PortrayalSection.PortrayalTypes.NoPortrayal() }</i></p>
      </Show>
    </div>
    <div class="portrayal-section__portrayal-options">

      <Show when={ selectedPortrayal() === 'choropleth' }>
        <ChoroplethSettings layerId={ targetLayer() } />
      </Show>

      <Show when={ selectedPortrayal() === 'propsymbols' }>
        <ProportionalSymbolsSettings layerId={ targetLayer() } />
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
            { targetLayer() }
          </div>
        </div>
      </Show>
    </div>
  </div>;
}
