// Imports from solid-js
import { JSX, onCleanup, onMount } from 'solid-js';

// Imports from other packages
import { LocalizedString } from 'typesafe-i18n';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';

// Stores
import { modalStore, setModalStore } from '../../store/ModalStore';

// Styles
import '../../styles/ModalWindow.css';

export default function ModalWithChildren(): JSX.Element {
  const { LL } = useI18nContext();
  const successButton: LocalizedString = LL()[modalStore.successButton || 'SuccessButton']();
  const cancelButton: LocalizedString = LL()[modalStore.cancelButton || 'CancelButton']();
  const confirmCallback = modalStore.confirmCallback || (() => {});
  const cancelCallback = modalStore.cancelCallback || (() => {});

  let refParentNode: HTMLDivElement;

  return <div class="modal-window modal" style={{ display: 'flex' }} ref={refParentNode}>
    <div class="modal-background"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">{ null }</p>
        {/* <button class="delete" aria-label="close"></button> */}
      </header>
      <section class="modal-card-body">
        { /* */ }
      </section>
      <footer class="modal-card-foot">
        <button
          class="button is-success confirm-button"
        >{ null }</button>
        <button
          class="button cancel-button"
        >{ null }</button>
      </footer>
    </div>
  </div>;
}
