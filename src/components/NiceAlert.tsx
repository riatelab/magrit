import { LocalizedString } from 'typesafe-i18n';
import { JSX } from 'solid-js';
import { useI18nContext } from '../i18n/i18n-solid';
import { niceAlertStore, setNiceAlertStore } from '../store/NiceAlertStore';
import '../styles/NiceAlert.css';
import '../styles/AlertAnimations.css';

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

  return <div class="modal nice-alert" style={{ display: 'flex' }}>
    <div class="modal-background"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        {/* <button class="delete" aria-label="close"></button> */}
      </header>
      <section class="modal-card-body f-modal-alert">
        { makeAnimation(niceAlertStore.type) }
        { niceAlertStore.content }
      </section>
      <footer class="modal-card-foot">
        <button
          class="button is-success"
          onClick={ () => { confirmCallback(); setNiceAlertStore({ show: false }); } }
        >{ successButton }</button>
        <button
          class="button"
          onClick={ () => { cancelCallback(); setNiceAlertStore({ show: false }); } }
        >{ cancelButton }</button>
      </footer>
    </div>
  </div>;
}
