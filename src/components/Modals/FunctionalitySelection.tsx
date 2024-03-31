// Imports from solid-js
import {
  createSignal, For, type JSX, Match, onCleanup, onMount, Show, Switch,
} from 'solid-js';

// Imports from other libraries
import { FaSolidArrowLeftLong, FaSolidMapLocationDot } from 'solid-icons/fa';
import { ImStatsBars } from 'solid-icons/im';
import { VsServerProcess } from 'solid-icons/vs';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { summaryForChoosingPortrayal } from '../../helpers/layerDescription';

// Stores
import { functionalitySelectionStore, setFunctionalitySelectionStore } from '../../store/FunctionalitySelectionStore';
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
import MushroomsSettings from '../PortrayalOption/MushroomsSettings.tsx';
import AggregationSettings from '../PortrayalOption/AggregationSettings.tsx';
import SelectionSettings from '../PortrayalOption/SelectionSettings.tsx';
import MessageBlock from '../MessageBlock.tsx';
import SimplificationSettings from '../PortrayalOption/SimplificationSettings.tsx';
import PointAnalysisSettings from '../PortrayalOption/PointAnalysisSettings.tsx';

// Type / interfaces / enums
import {
  AnalysisOperationType,
  ProcessingOperationType,
  RepresentationType,
} from '../../global.d';

// Styles
import '../../styles/FunctionalitySelection.css';

interface FunctionalityDescription {
  name: string;
  type: RepresentationType | ProcessingOperationType | AnalysisOperationType;
  enabled: boolean;
}

const functionalityDescriptions: FunctionalityDescription[] = [
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
    name: 'PointAnalysis',
    type: AnalysisOperationType.pointAnalysis,
  },
  {
    name: 'SimpleLinearRegression',
    type: AnalysisOperationType.simpleLinearRegression,
  },
  {
    name: 'Aggregation',
    type: ProcessingOperationType.aggregation,
  },
  {
    name: 'Selection',
    type: ProcessingOperationType.selection,
  },
  {
    name: 'Simplification',
    type: ProcessingOperationType.simplification,
  },
].map((p) => ({ ...p, enabled: false }));

function CardFunctionality(
  pDesc: FunctionalityDescription & {
    onClick: ((arg0: MouseEvent | KeyboardEvent, arg1: FunctionalityDescription) => void),
  },
): JSX.Element {
  const { LL } = useI18nContext();
  return <div
    classList={{
      card: true,
      'is-clickable': pDesc.enabled,
      'is-disabled': !pDesc.enabled,
    }}
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
        <Switch>
          <Match when={Object.values(RepresentationType).includes(pDesc.type)}>
            <FaSolidMapLocationDot style={{ margin: '0 0.5em 0 0.25em', width: '2em', height: '2em' }} />
          </Match>
          <Match when={Object.values(ProcessingOperationType).includes(pDesc.type)}>
            <VsServerProcess style={{ margin: '0 0.5em 0 0.25em', width: '2em', height: '2em' }} />
          </Match>
          <Match when={Object.values(AnalysisOperationType).includes(pDesc.type)}>
            <ImStatsBars style={{ margin: '0 0.5em 0 0.25em', width: '2em', height: '2em' }} />
          </Match>
        </Switch>
        { LL().FunctionalitiesSection.FunctionalityTypes[pDesc.name]() }
      </p>
    </header>
    <section class="card-content" style={{ padding: '1em' }}>
      <div class="content">
        { LL().PortrayalSelection.ShortDescriptions[pDesc.name]() }
      </div>
    </section>
  </div>;
}

export default function FunctionalitySelection(): JSX.Element {
  // We need to have a layerId to display the portrayal selection
  // but we shouldn't be able to reach this component without a layerId
  if (!functionalitySelectionStore.id) {
    throw new Error('No layer or table id provided');
  }
  const { LL } = useI18nContext();
  const [
    selectedFunctionality,
    setSelectedFunctionality,
  ] = createSignal<FunctionalityDescription | null>(null);
  let refParentNode: HTMLDivElement;

  // Clone the functionalityDescriptions array
  const functionalities = functionalityDescriptions.slice();

  // - What are the available variable for the selected layer?
  // - What is the geometry type for the selected layer ?
  // - How many features are there in the selected layer ?
  const {
    hasAnyVariable,
    availableVariables: vars,
    geomType,
    name: layerName,
    nFeatures,
  } = summaryForChoosingPortrayal(functionalitySelectionStore.id);
  // - Is there any tabular datasets that may contain information for links ?
  const projectHasTabularDataset = layersDescriptionStore.tables.length > 0;

  // Set the enable flag for the various functionality types
  functionalities.forEach((p) => {
    switch (p.type) {
      case RepresentationType.choropleth:
        // eslint-disable-next-line no-param-reassign
        p.enabled = nFeatures > 1 && vars.nRatio > 0;
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
        p.enabled = nFeatures > 1 && (vars.nRatio > 0 || vars.nStock > 0) && geomType === 'polygon';
        break;
      case RepresentationType.categoricalChoropleth:
        // eslint-disable-next-line no-param-reassign
        p.enabled = nFeatures > 1 && vars.nCategorical > 0;
        break;
      case RepresentationType.grid:
        // eslint-disable-next-line no-param-reassign
        p.enabled = nFeatures > 1 && vars.nStock > 0 && geomType === 'polygon';
        break;
      case RepresentationType.smoothed:
        // eslint-disable-next-line no-param-reassign
        p.enabled = nFeatures > 1 && vars.nStock > 0 && (geomType === 'polygon' || geomType === 'point');
        break;
      case RepresentationType.cartogram:
        // eslint-disable-next-line no-param-reassign
        p.enabled = nFeatures > 1 && vars.nStock > 0;
        break;
      case RepresentationType.links:
        // eslint-disable-next-line no-param-reassign
        p.enabled = (
          nFeatures > 1
          && projectHasTabularDataset
          && vars.nIdentifier > 0
          && (geomType === 'polygon' || geomType === 'point')
        );
        break;
      case RepresentationType.mushrooms:
        // eslint-disable-next-line no-param-reassign
        p.enabled = vars.nStock >= 2 && (geomType === 'polygon' || geomType === 'point');
        break;
      case ProcessingOperationType.aggregation:
        // eslint-disable-next-line no-param-reassign
        p.enabled = nFeatures > 1 && geomType === 'polygon';
        break;
      case ProcessingOperationType.selection:
        // eslint-disable-next-line no-param-reassign
        p.enabled = nFeatures > 1 && hasAnyVariable;
        break;
      case ProcessingOperationType.simplification:
        // eslint-disable-next-line no-param-reassign
        p.enabled = geomType === 'polygon' || geomType === 'linestring';
        break;
      case AnalysisOperationType.pointAnalysis:
        // eslint-disable-next-line no-param-reassign
        p.enabled = geomType === 'point';
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
      if (selectedFunctionality()) {
        // Reset selected functionality so we go back to the list of functionality types
        setSelectedFunctionality(null);
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
    class="modal-window modal functionality-selection"
    style={{ display: 'flex' }}
    ref={refParentNode!}
    aria-modal="true"
    role="dialog"
  >
    <div class="modal-background" />
    <div class="modal-card" style={{ width: '70vw', height: '90vh' }}>
      <header class="modal-card-head">
        <Show when={!selectedFunctionality()}>
          <p class="modal-card-title">{ LL().PortrayalSelection.Title() }</p>
        </Show>
        <Show when={selectedFunctionality()}>
          <p class="modal-card-title">
            { LL().PortrayalSelection.Title2() }
            &nbsp;-&nbsp;
            { LL().FunctionalitiesSection.FunctionalityTypes[selectedFunctionality()!.name] }</p>
        </Show>
      </header>
      <section class="modal-card-body is-flex is-flex-direction-column">
        <Show when={!selectedFunctionality()}>
          <MessageBlock type={'primary'} useIcon={true}>
            <p>{ LL().PortrayalSelection.Information() }</p>
          </MessageBlock>
          <div class="has-text-centered mb-4">
            {LL().PortrayalSelection.Layer()}
            &nbsp;<b>{ layerName }</b>
          </div>
          <section style={{ height: '100%', overflow: 'auto', padding: '1em' }}>
            <div
              style={{
                display: 'grid',
                'grid-template-columns': 'repeat(auto-fill, minmax(27rem, 1fr))',
                'grid-gap': '1rem',
              }}
            >
              <For each={functionalityDescriptions}>
                {
                  (p) => <CardFunctionality
                    {...p}
                    onClick={(e, pDesc) => {
                      setSelectedFunctionality(pDesc);
                    }}
                  />
                }
              </For>
            </div>
          </section>
        </Show>
        <Show when={selectedFunctionality()}>
          <div class="mb-4 is-size-5">
            {LL().PortrayalSelection.Layer()}
            &nbsp;<b>{ layerName }</b>
          </div>
          <Switch>
            <Match when={selectedFunctionality()!.type === RepresentationType.choropleth}>
              <ChoroplethSettings layerId={functionalitySelectionStore.id!}/>
            </Match>
            <Match when={selectedFunctionality()!.type === RepresentationType.proportionalSymbols}>
              <ProportionalSymbolsSettings layerId={functionalitySelectionStore.id!}/>
            </Match>
            <Match when={selectedFunctionality()!.type === RepresentationType.discontinuity}>
              <DiscontinuitySettings layerId={functionalitySelectionStore.id!}/>
            </Match>
            {/* eslint-disable-next-line max-len */}
            <Match when={selectedFunctionality()!.type === RepresentationType.categoricalChoropleth}>
              <CategoricalChoroplethSettings layerId={functionalitySelectionStore.id!}/>
            </Match>
            <Match when={selectedFunctionality()!.type === RepresentationType.labels}>
              <LabelsSettings layerId={functionalitySelectionStore.id!}/>
            </Match>
            <Match when={selectedFunctionality()!.type === RepresentationType.smoothed}>
              <SmoothingSettings layerId={functionalitySelectionStore.id!}/>
            </Match>
            <Match when={selectedFunctionality()!.type === RepresentationType.cartogram}>
              <CartogramSettings layerId={functionalitySelectionStore.id!}/>
            </Match>
            <Match when={selectedFunctionality()!.type === RepresentationType.grid}>
              <GriddingSettings layerId={functionalitySelectionStore.id!}/>
            </Match>
            <Match when={selectedFunctionality()!.type === RepresentationType.links}>
              <LinksSettings layerId={functionalitySelectionStore.id!}/>
            </Match>
            <Match when={selectedFunctionality()!.type === RepresentationType.mushrooms}>
              <MushroomsSettings layerId={functionalitySelectionStore.id!}/>
            </Match>
            <Match when={selectedFunctionality()!.type === ProcessingOperationType.aggregation}>
              <AggregationSettings layerId={functionalitySelectionStore.id!} />
            </Match>
            <Match when={selectedFunctionality()!.type === ProcessingOperationType.selection}>
              <SelectionSettings layerId={functionalitySelectionStore.id!} />
            </Match>
            <Match when={selectedFunctionality()!.type === ProcessingOperationType.simplification}>
              <SimplificationSettings layerId={functionalitySelectionStore.id!} />
            </Match>
            <Match when={selectedFunctionality()!.type === AnalysisOperationType.pointAnalysis}>
              <PointAnalysisSettings layerId={functionalitySelectionStore.id!} />
            </Match>
          </Switch>
        </Show>
      </section>
      <footer class="modal-card-foot" style={{ 'justify-content': 'space-between' }}>
        <div>
          <Show when={selectedFunctionality()}>
            <button
              class="button"
              onClick={() => setSelectedFunctionality(null)}
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
            onClick={() => { setFunctionalitySelectionStore({ show: false, id: '', type: '' }); }}
          >
            { LL().CancelButton() }
          </button>
        </div>
      </footer>
    </div>
  </div>;
}
