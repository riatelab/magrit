// Imports from solid-js
import {
  createSignal,
  For,
  type JSX,
  Match,
  onCleanup,
  onMount,
  Show,
  Switch,
} from 'solid-js';

// Imports from other libraries
import { FaSolidArrowLeftLong } from 'solid-icons/fa';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import {
  getLayerName,
  layerAnyAvailableVariable,
  layerAvailableVariables,
  layerGeometryType,
} from '../../helpers/layerDescription';

// Stores
import { portrayalSelectionStore, setPortrayalSelectionStore } from '../../store/PortrayalSelectionStore';
import { layersDescriptionStore } from '../../store/LayersDescriptionStore';

// Subcomponents
import CartogramSettings from '../PortrayalOption/CartogramSettings.tsx';
import ChoroplethSettings from '../PortrayalOption/ChoroplethSettings.tsx';
import ProportionalSymbolsSettings from '../PortrayalOption/ProportionalSymbolsSettings.tsx';
import DiscontinuitySettings from '../PortrayalOption/DiscontinuitySettings.tsx';
import CategoricalChoroplethSettings from '../PortrayalOption/CategoricalChoroplethSettings.tsx';
import LabelsSettings from '../PortrayalOption/LabelsSettings.tsx';
import SmoothingSettings from '../PortrayalOption/SmoothingSettings.tsx';
import GriddingSettings from '../PortrayalOption/GriddingSettings.tsx';
import LinksSettings from '../PortrayalOption/LinksSettings.tsx';
import InformationBanner from '../InformationBanner.tsx';

// Type / interfaces / enums
import { RepresentationType } from '../../global.d';

// Styles
import '../../styles/PortrayalSelection.css';
import MushroomsSettings from '../PortrayalOption/MushroomsSettings.tsx';
import AggregationSettings from '../PortrayalOption/AggregationSettings.tsx';

interface PortrayalDescription {
  name: string;
  type: RepresentationType | null;
  enabled: boolean;
}

const portrayalDescriptions: PortrayalDescription[] = [
  {
    name: 'Choropleth',
    type: RepresentationType.choropleth,
  },
  {
    name: 'ProportionalSymbols',
    type: RepresentationType.proportionalSymbols,
  },
  {
    name: 'Labels',
    type: RepresentationType.labels,
  },
  {
    name: 'Discontinuity',
    type: RepresentationType.discontinuity,
  },
  {
    name: 'CategoricalChoropleth',
    type: RepresentationType.categoricalChoropleth,
  },
  {
    name: 'Smoothed',
    type: RepresentationType.smoothed,
  },
  {
    name: 'Cartogram',
    type: RepresentationType.cartogram,
  },
  {
    name: 'Grid',
    type: RepresentationType.grid,
  },
  {
    name: 'Links',
    type: RepresentationType.links,
  },
  {
    name: 'Mushrooms',
    type: RepresentationType.mushrooms,
  },
  {
    name: 'Aggregation',
    type: null,
  },
].map((p) => ({ ...p, enabled: false }));

function CardPortrayal(
  pDesc: PortrayalDescription & {
    onClick: ((arg0: MouseEvent | KeyboardEvent, arg1: PortrayalDescription) => void),
  },
): JSX.Element {
  const { LL } = useI18nContext();
  return <div
    classList={{
      card: true,
      'is-clickable': pDesc.enabled,
      'is-disabled': !pDesc.enabled,
    }}
    style={{ 'min-height': '11em' }}
    onClick={
      // We don't care about pDesc reactivity here
      // eslint-disable-next-line solid/reactivity
      pDesc.enabled
        ? (e) => pDesc.onClick(e, pDesc)
        : undefined
    }
    onKeyDown={
      pDesc.enabled
        ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            pDesc.onClick(e, pDesc);
          }
        }
        : undefined
    }
    aria-role="button"
    aria-disabled={!pDesc.enabled}
    tabindex={pDesc.enabled ? 0 : undefined}
  >
    <header class="card-header" style={{ 'box-shadow': 'none' }}>
      <p class="card-header-title">
        { LL().PortrayalSection.PortrayalTypes[pDesc.name]() }
      </p>
    </header>
    <section class="card-content">
      <div class="content">
        { LL().PortrayalSelection.ShortDescriptions[pDesc.name]() }
      </div>
    </section>
  </div>;
}

export default function PortrayalSelection(): JSX.Element {
  // We need to have a layerId to display the portrayal selection
  // but we shouldn't be able to reach this component without a layerId
  if (!portrayalSelectionStore.layerId) {
    throw new Error('No layerId provided');
  }
  const { LL } = useI18nContext();
  const [
    selectedPortrayal,
    setSelectedPortrayal,
  ] = createSignal<PortrayalDescription | null>(null);
  let refParentNode: HTMLDivElement;

  // Clone the portrayalDescriptions array
  const portrayals = portrayalDescriptions.slice();

  // What are the available variable for the selected layer?
  const hasAnyVariable = layerAnyAvailableVariable(portrayalSelectionStore.layerId);
  const vars = layerAvailableVariables(portrayalSelectionStore.layerId);
  // What is the geometry type for the selected layer ?
  const geomType = layerGeometryType(portrayalSelectionStore.layerId);

  // Is there any tabular datasets that may contain information for links ?
  const projectHasTabularDataset = layersDescriptionStore.tables.length > 0;

  // Set the enable flag for the various portrayal types
  portrayals.forEach((p) => {
    switch (p.type) {
      case RepresentationType.choropleth:
        // eslint-disable-next-line no-param-reassign
        p.enabled = vars.nRatio > 0;
        break;
      case RepresentationType.proportionalSymbols:
        // eslint-disable-next-line no-param-reassign
        p.enabled = vars.nStock > 0;
        break;
      case RepresentationType.labels:
        // eslint-disable-next-line no-param-reassign
        p.enabled = hasAnyVariable;
        break;
      case RepresentationType.discontinuity:
        // eslint-disable-next-line no-param-reassign
        p.enabled = (vars.nRatio > 0 || vars.nStock > 0) && geomType === 'polygon';
        break;
      case RepresentationType.categoricalChoropleth:
        // eslint-disable-next-line no-param-reassign
        p.enabled = vars.nCategorical > 0;
        break;
      case RepresentationType.grid:
        // eslint-disable-next-line no-param-reassign
        p.enabled = vars.nStock > 0 && geomType === 'polygon';
        break;
      case RepresentationType.smoothed:
        // eslint-disable-next-line no-param-reassign
        p.enabled = vars.nStock > 0 && (geomType === 'polygon' || geomType === 'point');
        break;
      case RepresentationType.cartogram:
        // eslint-disable-next-line no-param-reassign
        p.enabled = vars.nStock > 0;
        break;
      case RepresentationType.links:
        // eslint-disable-next-line no-param-reassign
        p.enabled = (
          projectHasTabularDataset
          && vars.nIdentifier > 0
          && (geomType === 'polygon' || geomType === 'point')
        );
        break;
      case RepresentationType.mushrooms:
        // eslint-disable-next-line no-param-reassign
        p.enabled = vars.nStock >= 2 && (geomType === 'polygon' || geomType === 'point');
        break;
      case null:
        // eslint-disable-next-line no-param-reassign
        p.enabled = vars.nCategorical > 0 && geomType === 'polygon';
        break;
      default:
        // eslint-disable-next-line no-param-reassign
        p.enabled = false;
        break;
    }
  });

  const listenerEscKey = (event: KeyboardEvent) => {
    const isEscape = event.key
      ? (event.key === 'Escape' || event.key === 'Esc')
      : (event.keyCode === 27);
    if (isEscape) {
      // We want a different behavior if a portrayal is selected or not
      if (selectedPortrayal()) {
        // Reset selected portrayal so we go back to the list of portrayal types
        setSelectedPortrayal(null);
      } else {
        // Close the modal
        (refParentNode.querySelector('.cancel-button') as HTMLElement).click();
      }
    }
  };

  onMount(() => {
    (refParentNode.querySelector('.modal-card-body')! as HTMLDivElement).focus();
    document.addEventListener('keydown', listenerEscKey);
  });

  onCleanup(() => {
    document.removeEventListener('keydown', listenerEscKey);
  });

  return <div
    class="modal-window modal portrayal-selection"
    style={{ display: 'flex' }}
    ref={refParentNode!}
    aria-modal="true"
    role="dialog"
  >
    <div class="modal-background" />
    <div class="modal-card" style={{ width: '70vw', height: '90vh' }}>
      <header class="modal-card-head">
        <Show when={!selectedPortrayal()}>
          <p class="modal-card-title">{ LL().PortrayalSelection.Title() }</p>
        </Show>
        <Show when={selectedPortrayal()}>
          <p class="modal-card-title">
            { LL().PortrayalSelection.Title2() }
            &nbsp;- { LL().PortrayalSection.PortrayalTypes[selectedPortrayal()!.name] }</p>
        </Show>
      </header>
      <section class="modal-card-body is-flex is-flex-direction-column">
        <Show when={!selectedPortrayal()}>
          <InformationBanner expanded={true}>
            <p>{ LL().PortrayalSelection.Information() }</p>
          </InformationBanner>
          <div class="has-text-centered mb-4">
            {LL().PortrayalSelection.Layer()}
            &nbsp;<b>{ getLayerName(portrayalSelectionStore.layerId) }</b>
          </div>
          <section style={{ height: '100%', overflow: 'auto', padding: '1em' }}>
            <div
              style={{
                display: 'grid',
                'grid-template-columns': 'repeat(auto-fill, minmax(27rem, 1fr))',
                'grid-gap': '1rem',
              }}
            >
              <For each={portrayalDescriptions}>
                {
                  (p) => <CardPortrayal
                    {...p}
                    onClick={(e, pDesc) => {
                      setSelectedPortrayal(pDesc);
                    }}
                  />
                }
              </For>
            </div>
          </section>
        </Show>
        <Show when={selectedPortrayal()}>
          <div class="mb-4 is-size-5">
            {LL().PortrayalSelection.Layer()}
            &nbsp;<b>{getLayerName(portrayalSelectionStore.layerId)}</b>
          </div>
          <Switch>
            <Match when={selectedPortrayal()!.type === RepresentationType.choropleth}>
              <ChoroplethSettings layerId={portrayalSelectionStore.layerId!}/>
            </Match>
            <Match when={selectedPortrayal()!.type === RepresentationType.proportionalSymbols}>
              <ProportionalSymbolsSettings layerId={portrayalSelectionStore.layerId!}/>
            </Match>
            <Match when={selectedPortrayal()!.type === RepresentationType.discontinuity}>
              <DiscontinuitySettings layerId={portrayalSelectionStore.layerId!}/>
            </Match>
            <Match when={selectedPortrayal()!.type === RepresentationType.categoricalChoropleth}>
              <CategoricalChoroplethSettings layerId={portrayalSelectionStore.layerId!}/>
            </Match>
            <Match when={selectedPortrayal()!.type === RepresentationType.labels}>
              <LabelsSettings layerId={portrayalSelectionStore.layerId!}/>
            </Match>
            <Match when={selectedPortrayal()!.type === RepresentationType.smoothed}>
              <SmoothingSettings layerId={portrayalSelectionStore.layerId!}/>
            </Match>
            <Match when={selectedPortrayal()!.type === RepresentationType.cartogram}>
              <CartogramSettings layerId={portrayalSelectionStore.layerId!}/>
            </Match>
            <Match when={selectedPortrayal()!.type === RepresentationType.grid}>
              <GriddingSettings layerId={portrayalSelectionStore.layerId!}/>
            </Match>
            <Match when={selectedPortrayal()!.type === RepresentationType.links}>
              <LinksSettings layerId={portrayalSelectionStore.layerId!}/>
            </Match>
            <Match when={selectedPortrayal()!.type === RepresentationType.mushrooms}>
              <MushroomsSettings layerId={portrayalSelectionStore.layerId!}/>
            </Match>
            <Match when={selectedPortrayal()!.type === null}>
              <AggregationSettings layerId={portrayalSelectionStore.layerId!} />
            </Match>
          </Switch>
        </Show>
      </section>
      <footer class="modal-card-foot" style={{ 'justify-content': 'space-between' }}>
        <div>
          <Show when={selectedPortrayal()}>
            <button
              class="button"
              onClick={() => setSelectedPortrayal(null)}
            >
              <FaSolidArrowLeftLong />
              &nbsp;
              <span>{ LL().PortrayalSelection.Back() }</span>
            </button>
          </Show>
        </div>
        <div>
          <button
            class="button cancel-button"
            onClick={() => { setPortrayalSelectionStore({ show: false, layerId: '' }); }}
          >
            { LL().CancelButton() }
          </button>
        </div>
      </footer>
    </div>
  </div>;
}
