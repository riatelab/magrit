// Imports from solid-js
import {
  createSignal, JSX, For,
  Match, onCleanup, onMount,
  Show, Switch,
} from 'solid-js';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { prepareStatisticalSummary } from '../../helpers/classification';
import { isFiniteNumber, unproxify } from '../../helpers/common';
import { round } from '../../helpers/math';

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

  const filteredSeriesVar1 = classificationMultivariatePanelStore.series![0]
    .filter((d) => isFiniteNumber(d))
    .map((d) => +d);

  const filteredSeriesVar2 = classificationMultivariatePanelStore.series![1]
    .filter((d) => isFiniteNumber(d))
    .map((d) => +d);

  // Basic statistical summary displayed to the user
  const statSummaryVar1 = prepareStatisticalSummary(filteredSeriesVar1);
  const statSummaryVar2 = prepareStatisticalSummary(filteredSeriesVar2);

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
