// Imports from solid-js
import { JSX, onCleanup, onMount } from 'solid-js';
import { autofocus } from '@solid-primitives/autofocus';

// Imports from other packages
import { LocalizedString } from 'typesafe-i18n';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';

// Stores
import { modalStore, setModalStore } from '../../store/ModalStore';

// Styles
import '../../styles/ModalWindow.css';

export default function DefaultModal(): JSX.Element {
  const { LL } = useI18nContext();
  const successButton: LocalizedString = LL()[modalStore.successButton || 'SuccessButton']();
  const cancelButton: LocalizedString = LL()[modalStore.cancelButton || 'CancelButton']();
  const confirmCallback = modalStore.confirmCallback || (() => {});
  const cancelCallback = modalStore.cancelCallback || (() => {});

  let refParentNode: HTMLDivElement;

  const makeListenerEscKey = (behavior: 'confirm' | 'cancel' | null) => {
    if (behavior === null) return () => {};
    return (event: KeyboardEvent) => {
      const isEscape = event.key
        ? (event.key === 'Escape' || event.key === 'Esc')
        : (event.keyCode === 27);
      if (isEscape) {
        (refParentNode.querySelector(`.${behavior}-button`) as HTMLElement).click();
      }
    };
  };

  const listenerEscKey = makeListenerEscKey(modalStore.escapeKey);

  onMount(() => {
    // Bind the escape key to the chosen behavior
    document.addEventListener('keydown', listenerEscKey);
  });

  onCleanup(() => {
    // Unbind the escape key
    document.removeEventListener('keydown', listenerEscKey);
  });

  return <div class="modal-window modal" style={{ display: 'flex' }} ref={refParentNode}>
    <div class="modal-background"></div>
    <div class="modal-card" style={ modalStore.width ? { width: `${modalStore.width}px` } : {} }>
      <header class="modal-card-head">
        <p class="modal-card-title">{ modalStore.title }</p>
        {/* <button class="delete" aria-label="close"></button> */}
      </header>
      <section class="modal-card-body">
        { modalStore.content }
      </section>
      <footer class="modal-card-foot">
        <button
          class="button is-success confirm-button"
          ref={autofocus}
          autofocus
          onClick={ () => { confirmCallback(); setModalStore({ show: false, content: null }); } }
        >{ successButton }</button>
        <button
          class="button cancel-button"
          onClick={ () => { cancelCallback(); setModalStore({ show: false, content: null }); } }
        >{ cancelButton }</button>
      </footer>
    </div>
  </div>;
}
