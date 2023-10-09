// Imports from solid-js
import { JSX, children, createContext } from 'solid-js';

// Imports from other packages
import { LocalizedString } from 'typesafe-i18n';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';

// Stores
import { modalWithChildrenStore, resetModalWithChildrenStore } from '../../store/ModalWithChildrenStore';

// Styles
import '../../styles/ModalWindow.css';
import { TranslationFunctions } from '../../i18n/i18n-types';

export const ModalContext = createContext<() => TranslationFunctions>();

export default function ModalWithChildren(props): JSX.Element {
  const { LL } = useI18nContext();
  const successButton: LocalizedString = LL()[modalWithChildrenStore.successButton || 'SuccessButton']();
  const cancelButton: LocalizedString = LL()[modalWithChildrenStore.cancelButton || 'CancelButton']();
  const confirmCallback = modalWithChildrenStore.confirmCallback || (() => {});
  const cancelCallback = modalWithChildrenStore.cancelCallback || (() => {});
  const c = children(() => props.children);

  let refParentNode: HTMLDivElement;

  return <ModalContext.Provider value={LL}>
    <div class="modal-window modal" style={{ display: 'flex' }} ref={refParentNode}>
      <div class="modal-background"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">{ modalWithChildrenStore.title }</p>
        </header>
        <section class="modal-card-body">
          { c() }
        </section>
        <footer class="modal-card-foot">
          <button
            class="button is-success confirm-button"
            onClick={ () => { confirmCallback(); resetModalWithChildrenStore(); } }
          >{ successButton }</button>
          <button
            class="button cancel-button"
            onClick={ () => { cancelCallback(); resetModalWithChildrenStore(); } }
          >{ cancelButton }</button>
        </footer>
      </div>
    </div>
  </ModalContext.Provider>;
}
