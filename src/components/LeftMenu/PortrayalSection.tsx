import {
  JSX,
  Show,
  createSignal,
  Accessor,
  Setter,
} from 'solid-js';
import { useI18nContext } from '../../i18n/i18n-solid';

import { layersDescriptionStore } from '../../store/LayersDescriptionStore';

import { isCandidateForRepresentation } from '../../helpers/layerDescription';

import DropdownMenu from '../DropdownMenu.tsx';
import ChoroplethSettings from './PortrayalOption/ChoroplethSettings.tsx';

import '../../styles/PortrayalSection.css';
import ProportionalSymbolsSettings from './PortrayalOption/ProportionalSymbolsSettings.tsx';

function layerAvailableVariables(layerId: string) {
  const layer = layersDescriptionStore.layers.find((l) => l.id === layerId);

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
  ]: [Accessor<null | string>, Setter<null | string>] = createSignal(null);
  const [
    availableVariables,
    setAvailableVariables,
  ]: [Accessor<null | any>, Setter<null | any>] = createSignal(null);
  const [
    selectedPortrayal,
    setSelectedPortrayal,
  ]: [Accessor<null | string>, Setter<null | string>] = createSignal(null);

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
          onClick={ (ev) => { setSelectedPortrayal('choropleth'); } }
          classList={{ 'is-hidden': !availableVariables()?.hasRatio, selected: selectedPortrayal() === 'choropleth' }}
        >
          { LL().PortrayalSection.PortrayalTypes.Choropleth() }
        </li>
        <li
          onClick={ (ev) => { setSelectedPortrayal('propsymbols'); } }
          classList={{ 'is-hidden': !availableVariables()?.hasStock, selected: selectedPortrayal() === 'propsymbols' }}
        >
          { LL().PortrayalSection.PortrayalTypes.ProportionalSymbols() }
        </li>
        <li
          onClick={ (ev) => { setSelectedPortrayal('foo'); } }
          classList={{ 'is-hidden': !availableVariables()?.hasIdentifier, selected: selectedPortrayal() === 'foo' }}
        >
          Fooo
        </li>
        <li
          onClick={ (ev) => { setSelectedPortrayal('bar'); } }
          classList={{ 'is-hidden': !availableVariables()?.hasCategorical, selected: selectedPortrayal() === 'bar' }}
        >
          Baar
        </li>
      </ul>
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
