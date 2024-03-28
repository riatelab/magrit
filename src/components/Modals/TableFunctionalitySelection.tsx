// Imports from solid-js
import {
  createSignal,
  type JSX, onCleanup, onMount, Show,
} from 'solid-js';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';

export default function TableFunctionalitySelection(): JSX.Element {
  const { LL } = useI18nContext();
  let refParentNode: HTMLDivElement;

  const [
    selectedFunctionality,
    setSelectedFunctionality,
  ] = createSignal<string>('');

  const listenerEscKey = (event: KeyboardEvent) => {
    const isEscape = event.key
      ? (event.key === 'Escape' || event.key === 'Esc')
      : (event.keyCode === 27);
    if (isEscape) {
      // We want a different behavior if a functionality is selected or not
      if (selectedFunctionality()) {
        // Reset selected functionality so we go back to the list of functionality types
        setSelectedFunctionality('');
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
    <div class="modal-background"/>
    <div class="modal-card" style={{ width: '70vw', height: '90vh' }}>
      <header class="modal-card-head">
        <Show when={!selectedFunctionality()}>
          <p class="modal-card-title">{LL().PortrayalSelection.Title()}</p>
        </Show>
        <Show when={selectedFunctionality()}>
          <p class="modal-card-title">
            {LL().PortrayalSelection.Title2()}
            &nbsp;- {LL().PortrayalSection.PortrayalTypes[selectedFunctionality()!.name]}</p>
        </Show>
      </header>
      <section class="modal-card-body is-flex is-flex-direction-column">
      </section>
      <footer class="modal-card-foot" style={{ 'justify-content': 'space-between' }}>
      </footer>
    </div>
  </div>;
}
