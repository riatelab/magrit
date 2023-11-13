import {
  createSignal, JSX, onMount, Show,
} from 'solid-js';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { isCandidateForRepresentation } from '../../helpers/layerDescription';

// Stores
import { layersDescriptionStore } from '../../store/LayersDescriptionStore';

// Subcomponents
import DropdownMenu from '../DropdownMenu.tsx';
import ChoroplethSettings from './PortrayalOption/ChoroplethSettings.tsx';
import LabelsSettings from './PortrayalOption/LabelsSettings.tsx';
import ProportionalSymbolsSettings from './PortrayalOption/ProportionalSymbolsSettings.tsx';

// Types / Interfaces / Enums
import { RepresentationType } from '../../global.d';

// Styles
import '../../styles/PortrayalSection.css';

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

function layerAnyAvailableVariable(layerId: string) {
  const layer = layersDescriptionStore.layers
    .find((l) => l.id === layerId);

  if (!layer || !layer.fields) {
    return false;
  }

  return layer.fields.length > 0;
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
  ] = createSignal<{
    hasCategorical: boolean,
    hasStock: boolean,
    hasRatio: boolean,
    hasIdentifier: boolean,
    // hasUnknown,
  } | null>(null);
  const [
    selectedPortrayal,
    setSelectedPortrayal,
  ] = createSignal<RepresentationType | null>(null);

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
          onClick={ () => { setSelectedPortrayal(RepresentationType.choropleth); } }
          classList={{ 'is-hidden': !availableVariables()?.hasRatio, selected: selectedPortrayal() === RepresentationType.choropleth }}
        >
          { LL().PortrayalSection.PortrayalTypes.Choropleth() }
        </li>
        <li
          onClick={ () => { setSelectedPortrayal(RepresentationType.proportionalSymbols); } }
          classList={{ 'is-hidden': !availableVariables()?.hasStock, selected: selectedPortrayal() === RepresentationType.proportionalSymbols }}
        >
          { LL().PortrayalSection.PortrayalTypes.ProportionalSymbols() }
        </li>
        <li
          onClick={ () => { setSelectedPortrayal(RepresentationType.categorical); } }
          classList={{ 'is-hidden': !availableVariables()?.hasCategorical, selected: selectedPortrayal() === RepresentationType.categorical }}
        >
        </li>
        <li
          onClick={ () => { setSelectedPortrayal(RepresentationType.discontinuity); } }
          classList={{
            'is-hidden': !availableVariables()?.hasStock || !availableVariables()?.hasRatio,
            selected: selectedPortrayal() === RepresentationType.discontinuity,
          }}
        >
        </li>
        <li
          onClick={ () => { setSelectedPortrayal(RepresentationType.labels); } }
          classList={{
            'is-hidden': !layerAnyAvailableVariable(targetLayer() as string),
            selected: selectedPortrayal() === RepresentationType.labels,
          }}
        >
          { LL().PortrayalSection.PortrayalTypes.Labels() }
        </li>
      </ul>
      <Show when={
        availableVariables()
        && !layerAnyAvailableVariable(targetLayer())
        && !availableVariables()?.hasRatio
        && !availableVariables()?.hasStock
        && !availableVariables()?.hasCategorical
      }>
        <p><i>{ LL().PortrayalSection.PortrayalTypes.NoPortrayal() }</i></p>
      </Show>
    </div>
    <div class="portrayal-section__portrayal-options">

      <Show when={ selectedPortrayal() === RepresentationType.choropleth }>
        <ChoroplethSettings layerId={ targetLayer() } />
      </Show>

      <Show when={ selectedPortrayal() === RepresentationType.proportionalSymbols }>
        <ProportionalSymbolsSettings layerId={ targetLayer() } />
      </Show>

      <Show when={ selectedPortrayal() === RepresentationType.labels }>
        <LabelsSettings layerId={ targetLayer() } />
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
