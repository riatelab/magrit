// Imports from solid-js
import {
  createSignal, JSX, For,
  Match, onCleanup, onMount,
  Show, Switch,
} from 'solid-js';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { unproxify } from '../../helpers/common';

// Stores
import { classificationMultivariatePanelStore, setClassificationMultivariatePanelStore } from '../../store/ClassificationMultivariatePanelStore';

// Styles
import '../../styles/ClassificationPanel.css';

// Types, interfaces and enums
import {
  type BivariateChoroplethParameters,
  ClassificationMethod,
  type CustomPalette,
} from '../../global.d';

export default function ClassificationBivariatePanel(): JSX.Element {
  const { LL } = useI18nContext();

  const parameters = classificationMultivariatePanelStore
    .classificationParameters as BivariateChoroplethParameters;

  console.log('Bivariate classification parameters:', parameters);

  // Signals for the current component:
  // - the classification for the variable 1
  const [
    classificationMethodVar1,
    setClassificationMethodVar1,
  ] = createSignal<ClassificationMethod>(
    parameters.variable1.method,
  );
  // - the classification for the variable 2
  const [
    classificationMethodVar2,
    setClassificationMethodVar2,
  ] = createSignal<ClassificationMethod>(
    parameters.variable2.method,
  );
  // - the color scheme
  const [
    colorScheme,
    setColorScheme,
  ] = createSignal<CustomPalette>(
    parameters.palette,
  );
  // - the color chosen by the user for the no data values
  const [
    noDataColor,
    setNoDataColor,
  ] = createSignal<string>(
    parameters.noDataColor,
  );
  // - the current classification information
  //   (given the last option that changed, or the default breaks)
  const [
    currentClassifInfo,
    setCurrentClassifInfo,
  ] = createSignal<BivariateChoroplethParameters>(unproxify(parameters));
  let refParentNode: HTMLDivElement;

  return <div
    class="modal-window modal classification-panel"
    style={{ display: 'flex' }}
    ref={refParentNode!}
    aria-modal="true"
    role="dialog"
  >
    <div class="modal-background" />
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">
          { LL().ClassificationPanel.title() }&nbsp;
          - {classificationMultivariatePanelStore.layerName}&nbsp;
          - {parameters.variable1.variable} &amp; {parameters.variable2.variable}
        </p>
      </header>
      <section class="modal-card-body">
        <div class="is-flex">
        </div>
      </section>
      <footer class="modal-card-foot">
        <button
          class="button is-success classification-panel__confirm-button"
          onClick={() => {
            if (classificationMultivariatePanelStore.onConfirm) {
              classificationMultivariatePanelStore.onConfirm(currentClassifInfo());
            }
            setClassificationMultivariatePanelStore({ show: false });
          }}
        >{LL().SuccessButton()}</button>
        <button
          class="button classification-panel__cancel-button"
          onClick={() => {
            if (classificationMultivariatePanelStore.onCancel) {
              classificationMultivariatePanelStore.onCancel();
            }
            setClassificationMultivariatePanelStore({ show: false });
          }}
        >{ LL().CancelButton() }</button>
      </footer>
    </div>
  </div>;
}
