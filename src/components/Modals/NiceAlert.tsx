// Imports from solid-js
import { JSX, onCleanup, onMount } from 'solid-js';
import { autofocus } from '@solid-primitives/autofocus';

// Imports from other packages
import { LocalizedString } from 'typesafe-i18n';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';

// Stores
import { niceAlertStore, resetNiceAlertStore } from '../../store/NiceAlertStore';

// Styles
import '../../styles/NiceAlert.css';
import '../../styles/AlertAnimations.css';

function makeAnimation(type: string): JSX.Element {
  if (type === 'warning') {
    return <div class="f-modal-icon f-modal-warning scaleWarning">
      <span class="f-modal-body pulseWarningIns"></span>
      <span class="f-modal-dot pulseWarningIns"></span>
    </div>;
  }
  if (type === 'error') {
    return <div class="f-modal-icon f-modal-error animate">
      <span class="f-modal-x-mark">
        <span class="f-modal-line f-modal-left animateXLeft"></span>
        <span class="f-modal-line f-modal-right animateXRight"></span>
      </span>
      <div class="f-modal-placeholder"></div>
      <div class="f-modal-fix"></div>
    </div>;
  }
  if (type === 'success') {
    return <div class="f-modal-icon f-modal-success animate">
      <span class="f-modal-line f-modal-tip animateSuccessTip"></span>
      <span class="f-modal-line f-modal-long animateSuccessLong"></span>
      <div class="f-modal-placeholder"></div>
      <div class="f-modal-fix"></div>
    </div>;
  }
  return <></>;
}
export default function NiceAlert(): JSX.Element {
  const { LL } = useI18nContext();
  const successButton: LocalizedString = LL()[niceAlertStore.successButton || 'SuccessButton']();
  const cancelButton: LocalizedString = LL()[niceAlertStore.cancelButton || 'CancelButton']();
  const confirmCallback = niceAlertStore.confirmCallback || (() => {});
  const cancelCallback = niceAlertStore.cancelCallback || (() => {});

  let refParentNode: HTMLDivElement;

  const listenerEscapeKey = (event: KeyboardEvent) => {
    const isEscape = event.key
      ? (event.key === 'Escape' || event.key === 'Esc')
      : (event.keyCode === 27);
    if (isEscape) {
      (refParentNode.querySelector('.cancel-button') as HTMLElement).click();
    }
  };

  const o = {
    ref: autofocus,
    autofocus: true,
  };

  onMount(() => {
    document.addEventListener('keydown', listenerEscapeKey);
  });

  onCleanup(() => {
    document.removeEventListener('keydown', listenerEscapeKey);
  });

  return <div
    class="modal nice-alert"
    style={{ display: 'flex' }}
    ref={refParentNode!}
    aria-modal="true"
    role="dialog"
  >
    <div class="modal-background"></div>
    <div class="modal-card">
      <section
        class="modal-card-body f-modal-alert is-flex is-flex-direction-column is-justify-content-center"
      >
        { makeAnimation(niceAlertStore.type as string) }
        { niceAlertStore.content }
      </section>
      <footer class="modal-card-foot">
        <button
          class="button is-success confirm-button"
          { ...(niceAlertStore.focusOn === 'confirm' ? o : {}) }
          onClick={() => {
            confirmCallback();
            resetNiceAlertStore();
          }}
        >{ successButton }</button>
        <button
          class="button cancel-button"
          { ...(niceAlertStore.focusOn === 'cancel' ? o : {}) }
          onClick={() => {
            cancelCallback();
            resetNiceAlertStore();
          }}
        >{ cancelButton }</button>
      </footer>
    </div>
  </div>;
}
