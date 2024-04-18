// Imports from solid-js
import {
  createSignal, For,
  type JSX,
  Match,
  onCleanup, onMount,
  Show, Switch,
} from 'solid-js';

// Imports from other packages
import { FaSolidArrowLeftLong } from 'solid-icons/fa';
import { VsServerProcess } from 'solid-icons/vs';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';

// Stores
import { functionalitySelectionStore, setFunctionalitySelectionStore } from '../../store/FunctionalitySelectionStore';
import { layersDescriptionStore } from '../../store/LayersDescriptionStore';

// Subcomponents
import LayerFromTabularSettings from '../PortrayalOption/LayerFromTabularSettings.tsx';

// Types / Interfaces / Enums
import { TableOperationType } from '../../global.d';

// Styles
import '../../styles/FunctionalitySelection.css';

interface TableFunctionalityDescription {
  name: string;
  type: TableOperationType;
  enabled: boolean;
}

const functionalityDescriptions: TableFunctionalityDescription[] = [
  {
    name: 'LayerCreationFromTable',
    type: TableOperationType.layerCreationFromTable,
  },
].map((p) => ({ ...p, enabled: false }));

function CardFunctionality(
  pDesc: TableFunctionalityDescription & {
    onClick: ((arg0: MouseEvent | KeyboardEvent, arg1: TableFunctionalityDescription) => void),
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
        <VsServerProcess style={{ margin: '0 0.5em 0 0.25em', width: '2em', height: '2em' }} />
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

export default function TableFunctionalitySelection(): JSX.Element {
  const { LL } = useI18nContext();
  let refParentNode: HTMLDivElement;

  const [
    selectedFunctionality,
    setSelectedFunctionality,
  ] = createSignal<TableFunctionalityDescription | null>(null);

  // Info about the targeted table
  const tableDescription = layersDescriptionStore.tables
    .find((table) => table.id === functionalitySelectionStore.id)!;

  // Clone the functionalityDescriptions array
  const functionalities = functionalityDescriptions.slice();

  // Set the enable flag for the various functionality types
  functionalities.forEach((p) => {
    // eslint-disable-next-line no-param-reassign
    p.enabled = true;
  });
  const listenerEscKey = (event: KeyboardEvent) => {
    const isEscape = event.key
      ? (event.key === 'Escape' || event.key === 'Esc')
      : (event.keyCode === 27);
    if (isEscape) {
      // We want a different behavior if a functionality is selected or not
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
    <div class="modal-background"/>
    <div class="modal-card" style={{ width: 'min(70vw, 1300px)', height: '90vh' }}>
      <header class="modal-card-head">
        <Show when={!selectedFunctionality()}>
          <p class="modal-card-title">{LL().PortrayalSelection.Title()}</p>
        </Show>
        <Show when={selectedFunctionality()}>
          <p class="modal-card-title">
            {LL().PortrayalSelection.Title2()}
            &nbsp;-&nbsp;
            {LL().FunctionalitiesSection.FunctionalityTypes[selectedFunctionality()!.name]}</p>
        </Show>
      </header>
      <section class="modal-card-body is-flex is-flex-direction-column">
        <Show when={!selectedFunctionality()}>
          <div class="has-text-centered mb-4">
            {LL().PortrayalSelection.Table()}
            &nbsp;<b>{tableDescription.name}</b>
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
            {LL().PortrayalSelection.Table()}
            &nbsp;<b>{tableDescription.name}</b>
          </div>
          <Switch>
            <Match when={selectedFunctionality()!.name === 'LayerCreationFromTable'}>
              <LayerFromTabularSettings tableId={tableDescription.id} />
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
            <FaSolidArrowLeftLong/>
              &nbsp;
              <span>{LL().PortrayalSelection.Back()}</span>
            </button>
          </Show>
        </div>
        <div>
          <button
            class="button cancel-button"
            onClick={() => {
              setFunctionalitySelectionStore({ show: false, id: '', type: '' });
            }}
          >
            {LL().CancelButton()}
          </button>
        </div>
      </footer>
    </div>
  </div>;
}
