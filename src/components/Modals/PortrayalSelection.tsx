// Imports from solid-js
import {
  createSignal,
  For,
  type JSX,
  Match,
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

// Subcomponents
import CartogramSettings from '../LeftMenu/PortrayalOption/CartogramSettings.tsx';
import ChoroplethSettings from '../LeftMenu/PortrayalOption/ChoroplethSettings.tsx';
import ProportionalSymbolsSettings from '../LeftMenu/PortrayalOption/ProportionalSymbolsSettings.tsx';
import DiscontinuitySettings from '../LeftMenu/PortrayalOption/DiscontinuitySettings.tsx';
import CategoricalChoroplethSettings from '../LeftMenu/PortrayalOption/CategoricalChoroplethSettings.tsx';
import LabelsSettings from '../LeftMenu/PortrayalOption/LabelsSettings.tsx';
import SmoothingSettings from '../LeftMenu/PortrayalOption/SmoothingSettings.tsx';
import GriddingSettings from '../LeftMenu/PortrayalOption/GriddingSettings.tsx';
import InformationBanner from '../InformationBanner.tsx';

// Type / interfaces / enums
import { RepresentationType } from '../../global.d';

// Styles
import '../../styles/PortrayalSelection.css';

interface PortrayalDescription {
  // id: string;
  name: string;
  type: RepresentationType;
  enabled: boolean;
  // description: string;
}

const portrayalDescriptions: Partial<PortrayalDescription>[] = [
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
];

function CardPortrayal(
  pDesc: Partial<PortrayalDescription> & {
    onClick: ((arg0: MouseEvent, arg1: PortrayalDescription) => void) },
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
      pDesc.enabled
        ? (e) => pDesc.onClick(e, pDesc)
        : undefined
    }
  >
    <header class="card-header" style={{ 'box-shadow': 'none' }}>
      <p class="card-header-title">
        { LL().PortrayalSection.PortrayalTypes[pDesc.name] }
      </p>
    </header>
    <section class="card-content">
      <div class="content">
        { LL().PortrayalSelection.ShortDescriptions[pDesc.name] }
      </div>

    </section>
  </div>;
}

export default function PortrayalSelection(
  ppp: {
    layerId?: string,
  },
): JSX.Element {
  const { LL } = useI18nContext();
  const [
    selectedPortrayal,
    setSelectedPortrayal,
  ] = createSignal<PortrayalDescription | null>(null);
  let refParentNode: HTMLDivElement;

  // Todo: choose if we want to use the store or the props
  const props = portrayalSelectionStore;

  // Clone the portrayalDescriptions array
  const portrayals = portrayalDescriptions.slice();

  if (!props.layerId) {
    portrayals.forEach((p) => {
      // eslint-disable-next-line no-param-reassign
      p.enabled = false;
    });
  } else {
    // What are the available variable for the selected layer?
    const hasAnyVariable = layerAnyAvailableVariable(props.layerId);
    const vars = layerAvailableVariables(props.layerId);
    // What is the geometry type for the selected layer ?
    const geomType = layerGeometryType(props.layerId);

    // Set the enable flag for
    portrayals.forEach((p) => {
      switch (p.type) {
        case RepresentationType.choropleth:
          // eslint-disable-next-line no-param-reassign
          p.enabled = vars.hasRatio;
          break;
        case RepresentationType.proportionalSymbols:
          // eslint-disable-next-line no-param-reassign
          p.enabled = vars.hasStock;
          break;
        case RepresentationType.labels:
          // eslint-disable-next-line no-param-reassign
          p.enabled = hasAnyVariable;
          break;
        case RepresentationType.discontinuity:
          // eslint-disable-next-line no-param-reassign
          p.enabled = (vars.hasRatio || vars.hasStock) && geomType === 'polygon';
          break;
        case RepresentationType.categoricalChoropleth:
          // eslint-disable-next-line no-param-reassign
          p.enabled = vars.hasCategorical;
          break;
        case RepresentationType.grid:
          // eslint-disable-next-line no-param-reassign
          p.enabled = vars.hasStock && geomType === 'polygon';
          break;
        case RepresentationType.smoothed:
          // eslint-disable-next-line no-param-reassign
          p.enabled = vars.hasStock && (geomType === 'polygon' || geomType === 'point');
          break;
        case RepresentationType.cartogram:
          // eslint-disable-next-line no-param-reassign
          p.enabled = vars.hasStock;
          break;
        default:
          // eslint-disable-next-line no-param-reassign
          p.enabled = false;
          break;
      }
    });
  }

  return <div class="modal-window modal portrayal-selection" style={{ display: 'flex' }} ref={refParentNode!}>
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
            &nbsp;<b>{ getLayerName(props.layerId) }</b>
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
          <div class="mb-4 is-size-4">
            {LL().PortrayalSelection.Layer()}
            &nbsp;<b>{getLayerName(props.layerId)}</b>
          </div>
          <Switch>
            <Match when={selectedPortrayal()!.type === RepresentationType.choropleth}>
              <ChoroplethSettings layerId={props.layerId!}/>
            </Match>
            <Match when={selectedPortrayal()!.type === RepresentationType.proportionalSymbols}>
              <ProportionalSymbolsSettings layerId={props.layerId!}/>
            </Match>
            <Match when={selectedPortrayal()!.type === RepresentationType.discontinuity}>
              <DiscontinuitySettings layerId={props.layerId!}/>
            </Match>
            <Match when={selectedPortrayal()!.type === RepresentationType.categoricalChoropleth}>
              <CategoricalChoroplethSettings layerId={props.layerId!}/>
            </Match>
            <Match when={selectedPortrayal()!.type === RepresentationType.labels}>
              <LabelsSettings layerId={props.layerId!}/>
            </Match>
            <Match when={selectedPortrayal()!.type === RepresentationType.smoothed}>
              <SmoothingSettings layerId={props.layerId!}/>
            </Match>
            <Match when={selectedPortrayal()!.type === RepresentationType.cartogram}>
              <CartogramSettings layerId={props.layerId!}/>
            </Match>
            <Match when={selectedPortrayal()!.type === RepresentationType.grid}>
              <GriddingSettings layerId={props.layerId!}/>
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
