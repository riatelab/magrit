import {
  createMemo,
  createSignal,
  type JSX,
  Match,
  Show,
  Switch,
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
import DiscontinuitySettings from './PortrayalOption/DiscontinuitySettings.tsx';
import CategoricalChoroplethSettings from './PortrayalOption/CategoricalChoroplethSettings.tsx';
import SmoothingSettings from './PortrayalOption/SmoothingSettings.tsx';

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

  const availablePortrayals = createMemo(() => {
    const entries = [];

    if (availableVariables()?.hasRatio) {
      entries.push({
        name: LL().PortrayalSection.PortrayalTypes.Choropleth(),
        value: RepresentationType.choropleth,
      });
    }
    if (availableVariables()?.hasStock) {
      entries.push({
        name: LL().PortrayalSection.PortrayalTypes.ProportionalSymbols(),
        value: RepresentationType.proportionalSymbols,
      });
      entries.push({
        name: LL().PortrayalSection.PortrayalTypes.Smoothed(),
        value: RepresentationType.smoothed,
      });
    }
    if (availableVariables()?.hasCategorical) {
      entries.push({
        name: LL().PortrayalSection.PortrayalTypes.Categorical(),
        value: RepresentationType.categoricalChoropleth,
      });
    }
    if (availableVariables()?.hasStock && availableVariables()?.hasRatio) {
      entries.push({
        name: LL().PortrayalSection.PortrayalTypes.Discontinuity(),
        value: RepresentationType.discontinuity,
      });
    }
    if (layerAnyAvailableVariable(targetLayer() as string)) {
      entries.push({
        name: LL().PortrayalSection.PortrayalTypes.Labels(),
        value: RepresentationType.labels,
      });
    }

    return entries;
  });

  // Todo: this should be reactive instead of unmounting
  //   in "LeftMenu"
  return <div class="portrayal-section">
    <DropdownMenu
      id={'portrayal-section__target-layer-dropdown'}
      entries={
        layersDescriptionStore.layers
          .filter(isCandidateForRepresentation)
          .map((layer) => ({ name: layer.name, value: layer.id }))}
      defaultEntry={ { name: LL().PortrayalSection.TargetLayer() } }
      prefix={ 'Layer: '}
      onChange={ (value) => {
        // Deselect the portrayal selected if any
        setSelectedPortrayal(null);
        // Set the target layer...
        setTargetLayer(value);
        // ...and compute the available portrayals for the variable of this layer
        setAvailableVariables(layerAvailableVariables(targetLayer()!));
      } }
    />
    <Show when={ targetLayer() }>
      <DropdownMenu
        id={'portrayal-section__portrayal-dropdown'}
        entries={ availablePortrayals() }
        defaultEntry={{ name: LL().PortrayalSection.ChooseARepresentation() }}
        onChange={(v) => setSelectedPortrayal(v as RepresentationType)}
      />
    </Show>
    {/* <div class="portrayal-section__portrayal-selection">
      <ul>
        <li
          onClick={ () => { setSelectedPortrayal(RepresentationType.choropleth); } }
          classList={{
            'is-hidden': !availableVariables()?.hasRatio,
            selected: selectedPortrayal() === RepresentationType.choropleth,
          }}
        >
          { LL().PortrayalSection.PortrayalTypes.Choropleth() }
        </li>
        <li
          onClick={ () => { setSelectedPortrayal(RepresentationType.proportionalSymbols); } }
          classList={{
            'is-hidden': !availableVariables()?.hasStock,
            selected: selectedPortrayal() === RepresentationType.proportionalSymbols,
          }}
        >
          { LL().PortrayalSection.PortrayalTypes.ProportionalSymbols() }
        </li>
        <li
          onClick={ () => { setSelectedPortrayal(RepresentationType.categoricalChoropleth); } }
          classList={{
            'is-hidden': !availableVariables()?.hasCategorical,
            selected: selectedPortrayal() === RepresentationType.categoricalChoropleth,
          }}
        >
          { LL().PortrayalSection.PortrayalTypes.Categorical() }
        </li>
        <li
          onClick={ () => { setSelectedPortrayal(RepresentationType.discontinuity); } }
          classList={{
            'is-hidden': !availableVariables()?.hasStock || !availableVariables()?.hasRatio,
            selected: selectedPortrayal() === RepresentationType.discontinuity,
          }}
        >
          { LL().PortrayalSection.PortrayalTypes.Discontinuity() }
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
        <li
          onClick={ () => { setSelectedPortrayal(RepresentationType.smoothed); } }
          classList={{
            'is-hidden': !layerAnyAvailableVariable(targetLayer() as string),
            selected: selectedPortrayal() === RepresentationType.smoothed,
          }}
        >
          { LL().PortrayalSection.PortrayalTypes.Smoothed() }
        </li>
      </ul>
      <Show when={
        availableVariables()
        && !layerAnyAvailableVariable(targetLayer() as string)
        && !availableVariables()?.hasRatio
        && !availableVariables()?.hasStock
        && !availableVariables()?.hasCategorical
      }>
        <p><i>{ LL().PortrayalSection.PortrayalTypes.NoPortrayal() }</i></p>
      </Show>
    </div> */}
    <hr />
    <div class="portrayal-section__portrayal-options">
      <Switch>
        <Match when={ selectedPortrayal() === RepresentationType.choropleth }>
          <ChoroplethSettings layerId={ targetLayer() as string } />
        </Match>
        <Match when={ selectedPortrayal() === RepresentationType.proportionalSymbols }>
          <ProportionalSymbolsSettings layerId={ targetLayer() as string } />
        </Match>
        <Match when={ selectedPortrayal() === RepresentationType.discontinuity }>
          <DiscontinuitySettings layerId={ targetLayer() as string } />
        </Match>
        <Match when={ selectedPortrayal() === RepresentationType.categoricalChoropleth }>
          <CategoricalChoroplethSettings layerId={ targetLayer() as string } />
        </Match>
        <Match when={ selectedPortrayal() === RepresentationType.labels }>
          <LabelsSettings layerId={ targetLayer() as string } />
        </Match>
        <Match when={ selectedPortrayal() === RepresentationType.smoothed }>
          <SmoothingSettings layerId={ targetLayer() as string } />
        </Match>
      </Switch>
    </div>
  </div>;
}
