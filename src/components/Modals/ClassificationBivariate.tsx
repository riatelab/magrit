// Imports from solid-js
import {
  createSignal, JSX, For,
  Match, onCleanup, onMount,
  Show, Switch,
} from 'solid-js';

// Helpers
import d3 from '../../helpers/d3-custom';
import { useI18nContext } from '../../i18n/i18n-solid';
import { makeClassificationMenuEntries, prepareStatisticalSummary } from '../../helpers/classification';
import { isFiniteNumber, unproxify } from '../../helpers/common';
import { Mmin, round } from '../../helpers/math';

// Stores
import { classificationMultivariatePanelStore, setClassificationMultivariatePanelStore } from '../../store/ClassificationMultivariatePanelStore';

// Subcomponents
import DropdownMenu from '../DropdownMenu.tsx';

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

  const filteredSeriesVar1 = classificationMultivariatePanelStore.series![0]
    .filter((d) => isFiniteNumber(d))
    .map((d) => +d);

  const filteredSeriesVar2 = classificationMultivariatePanelStore.series![1]
    .filter((d) => isFiniteNumber(d))
    .map((d) => +d);

  // Basic statistical summary displayed to the user
  const statSummaryVar1 = prepareStatisticalSummary(filteredSeriesVar1);
  const statSummaryVar2 = prepareStatisticalSummary(filteredSeriesVar2);

  const allValuesSuperiorToZeroVar1 = filteredSeriesVar1.every((d) => d > 0);
  const allValuesSuperiorToZeroVar2 = filteredSeriesVar2.every((d) => d > 0);

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

  const entriesClassificationMethodVar1 = makeClassificationMenuEntries(
    LL,
    statSummaryVar1.unique,
    allValuesSuperiorToZeroVar1,
  );

  const entriesClassificationMethodVar2 = makeClassificationMenuEntries(
    LL,
    statSummaryVar2.unique,
    allValuesSuperiorToZeroVar2,
  );

  const listenerEscKey = (event: KeyboardEvent) => {
    // TODO: in many cases this modal is opened on the top of another modal
    //       we should take care to only close this one, not the other one
    //       (currently they both get closed)
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
          - {classificationMultivariatePanelStore.layerName}&nbsp;
          - {parameters.variable1.variable} &amp; {parameters.variable2.variable}
        </p>
      </header>
      <section class="modal-card-body">
        <div class="is-flex">
          <div style={{ width: '40%', 'text-align': 'center' }}>
            <h3> { LL().ClassificationPanel.summary() }</h3>
            <div>
              <table class="table bivariate is-bordered is-striped is-narrow is-hoverable is-fullwidth">
                <thead>
                  <tr>
                    <th></th>
                    <th>{ parameters.variable1.variable }</th>
                    <th>{ parameters.variable2.variable }</th>
                  </tr>
                </thead>
                <tbody>
                <tr>
                  {/* eslint-disable-next-line solid/no-innerhtml */}
                  <td innerHTML={LL().ClassificationPanel.population().replace(' (', '<br />(')}></td>
                  <td>{ statSummaryVar1.population }</td>
                  <td>{ statSummaryVar2.population }</td>
                </tr>
                <tr>
                  <td>{ LL().ClassificationPanel.minimum() }</td>
                  <td>{ round(statSummaryVar1.minimum, statSummaryVar1.precision) }</td>
                  <td>{ round(statSummaryVar2.minimum, statSummaryVar2.precision) }</td>
                </tr>
                <tr>
                  <td>{ LL().ClassificationPanel.maximum() }</td>
                  <td>{ round(statSummaryVar1.maximum, statSummaryVar1.precision) }</td>
                  <td>{ round(statSummaryVar2.maximum, statSummaryVar2.precision) }</td>
                </tr>
                <tr>
                  <td>{ LL().ClassificationPanel.mean() }</td>
                  <td>{ round(statSummaryVar1.mean, statSummaryVar1.precision) }</td>
                  <td>{ round(statSummaryVar2.mean, statSummaryVar2.precision) }</td>
                </tr>
                <tr>
                  <td>{ LL().ClassificationPanel.median() }</td>
                  <td>{ round(statSummaryVar1.median, statSummaryVar1.precision) }</td>
                  <td>{ round(statSummaryVar2.median, statSummaryVar2.precision) }</td>
                </tr>
                <tr>
                  <td>{ LL().ClassificationPanel.standardDeviation() }</td>
                  <td>{ round(statSummaryVar1.standardDeviation, statSummaryVar1.precision) }</td>
                  <td>{ round(statSummaryVar2.standardDeviation, statSummaryVar2.precision) }</td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ width: '55%', 'text-align': 'center' }}>
            <h3> { LL().ClassificationPanel.distribution() } </h3>
            <div></div>
          </div>
        </div>
        <hr />
        <div>
          <div
            style={{ width: '50%', 'text-align': 'center' }}
            class="is-flex is-flex-direction-column"
          >
            <div class="is-flex is-flex-direction-row">
              <p>Variable 1</p>
              <DropdownMenu
                id={'dropdown-classification-method-var1'}
                style={{ width: '220px' }}
                entries={entriesClassificationMethodVar1}
                defaultEntry={
                  entriesClassificationMethodVar1
                    .find((d) => d.value === classificationMethodVar1())!
                }
                onChange={(value) => {
                  console.log('Changed var1 classification method to:', value);
                }}
              />
            </div>
            <div class="is-flex is-flex-direction-row">
              <p style={{ 'vertical-align': 'bottom' }}>Variable 2</p>
              <DropdownMenu
                id={'dropdown-classification-method-var2'}
                style={{ width: '220px' }}
                entries={entriesClassificationMethodVar2}
                defaultEntry={
                  entriesClassificationMethodVar2
                    .find((d) => d.value === classificationMethodVar2())!
                }
                onChange={(value) => {
                  console.log('Changed var2 classification method to:', value);
                }}
              />
            </div>
          </div>
          <div style={{ width: '50%', 'text-align': 'center' }}>

          </div>
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
