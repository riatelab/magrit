// Imports from solid-js
import {
  createSignal, JSX, For,
  onCleanup, onMount,
  Show, createMemo,
} from 'solid-js';
import { createStore } from 'solid-js/store';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import {
  prepareStatisticalSummary,
} from '../../helpers/classification';
import { isFiniteNumber, unproxify } from '../../helpers/common';
import { Mmin, round } from '../../helpers/math';

// Stores
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';
import { classificationMultivariatePanelStore, setClassificationMultivariatePanelStore } from '../../store/ClassificationMultivariatePanelStore';

// Subcomponents
import DropdownMenu from '../DropdownMenu.tsx';
import InputFieldColor from '../Inputs/InputColor.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import InputFieldCheckbox from '../Inputs/InputCheckbox.tsx';

// Styles
import '../../styles/ClassificationPanel.css';

// Types, interfaces and enums
import {
  TricoloreScaleType,
  type TrivariateChoroplethParameters,
} from '../../global.d';

type SextantColorArray = [string, string, string, string, string, string];

export default function ClassificationTrivariatePanel(): JSX.Element {
  const { LL } = useI18nContext();

  const parameters = classificationMultivariatePanelStore
    .classificationParameters as TrivariateChoroplethParameters;

  const [
    currentClassifInfo,
    setCurrentClassifInfo,
  ] = createSignal<TrivariateChoroplethParameters>(unproxify(parameters));

  const [
    colorScaleType,
    setColorScaleType,
  ] = createSignal<TricoloreScaleType>(TricoloreScaleType.Discrete);

  const [useMeanCentering, setUseMeanCentering] = createSignal<boolean>(false);

  const [colorScaleParams, setColorScaleParams] = createStore({
    hue: 10,
    chroma: 120,
    lightness: 70,
    contrast: 0.2,
    spread: 1,
  });

  const [
    sextantColors,
    setSextantColors,
  ] = createSignal<SextantColorArray>(['#FFFF00', '#B3DCC3', '#01A0C6', '#B8B3D8', '#F11D8C', '#FFB3B3']);

  const [
    nClasses,
    setNClasses,
  ] = createSignal<4 | 9 | 16>(9);

  let refParentNode: HTMLDivElement;

  const listenerEscKey = (event: KeyboardEvent) => {
    const isEscape = event.key
      ? (event.key === 'Escape' || event.key === 'Esc')
      : (event.keyCode === 27);
    if (isEscape) {
      (refParentNode!.querySelector(
        '.classification-panel__cancel-button',
      ) as HTMLElement).click();
    }
  };

  onMount(() => {
    // We could set focus on the confirm button when the modal is shown
    // as in some other modal, although it is not as important here...
    document.body.addEventListener('keydown', listenerEscKey);
  });

  onCleanup(() => {
    document.body.removeEventListener('keydown', listenerEscKey);
  });

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
          - {classificationMultivariatePanelStore.layerName}
        </p>
      </header>
      <section class="modal-card-body">
        <div class="is-flex">
        </div>
        <hr />
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
