import { LocalizedString } from 'typesafe-i18n';
import { JSX } from 'solid-js';
import { useI18nContext } from './i18n/i18n-solid';
import { modalStore, setModalStore } from './store/ModalStore';

export default function DefaultModal(): JSX.Element {
  const { LL } = useI18nContext();
  const successButton: LocalizedString = LL()[modalStore.successButton || 'SuccessButton']();
  const cancelButton: LocalizedString = LL()[modalStore.cancelButton || 'CancelButton']();
  const confirmCallback = modalStore.confirmCallback || (() => {});
  const cancelCallback = modalStore.cancelCallback || (() => {});

  return <div class="modal" style={{ display: 'flex' }}>
    <div class="modal-background"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">{ modalStore.title }</p>
        {/* <button class="delete" aria-label="close"></button> */}
      </header>
      <section class="modal-card-body">
        { modalStore.content }
      </section>
      <footer class="modal-card-foot">
        <button
          class="button is-success"
          onClick={ () => { confirmCallback(); setModalStore({ show: false }); } }
        >{ successButton }</button>
        <button
          class="button"
          onClick={ () => { cancelCallback(); setModalStore({ show: false }); } }
        >{ cancelButton }</button>
      </footer>
    </div>
  </div>;
}
