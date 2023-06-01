import { LocalizedString } from 'typesafe-i18n';
import { JSX } from 'solid-js';
import { useI18nContext } from '../i18n/i18n-solid';
import { niceAlertStore, setNiceAlertStore } from '../store/NiceAlertStore';
import '../styles/NiceAlert.css';
import '../styles/AlertAnimations.css';

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
