// Imports from solid-js
import {
  createSignal, JSX, Match,
  onCleanup, onMount,
  Show, Switch,
} from 'solid-js';

// Imports from other packages
import toast from 'solid-toast';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import d3 from '../../helpers/d3-custom';
import {
  classificationMethodHasOption,
  getClassifier,
  parseUserDefinedBreaks,
  prepareStatisticalSummary,
  OptionsClassification,
} from '../../helpers/classification';
import { isNumber } from '../../helpers/common';
import { Mmin, Mround, round } from '../../helpers/math';
import { makeClassificationPlot, makeColoredBucketPlot, makeDistributionPlot } from '../DistributionPlots.tsx';

// Sub-components
import DropdownMenu from '../DropdownMenu.tsx';
import InputFieldCheckbox from '../Inputs/InputCheckbox.tsx';
import InputFieldRangeSlider from '../Inputs/InputRangeSlider.tsx';

// Store
import { classificationPanelStore, setClassificationPanelStore } from '../../store/ClassificationPanelStore';

// Styles
import '../../styles/ClassificationPanel.css';

// Types, interfaces and enums
import {
  ClassificationMethod, type ClassificationParameters,
  type DiscontinuityParameters,
} from '../../global.d';

export default function ClassificationDiscontinuityPanel(): JSX.Element {
  let refParentNode: HTMLDivElement;
  let refTextArea: HTMLTextAreaElement;
  const { LL } = useI18nContext();

  const entriesClassificationMethod = [
    {
      name: LL().ClassificationPanel.classificationMethods.quantiles(),
      value: ClassificationMethod.quantiles,
      options: [OptionsClassification.numberOfClasses],
    },
    {
      name: LL().ClassificationPanel.classificationMethods.equalIntervals(),
      value: ClassificationMethod.equalIntervals,
      options: [OptionsClassification.numberOfClasses],
    },
    {
      name: LL().ClassificationPanel.classificationMethods.q6(),
      value: ClassificationMethod.q6,
      options: [],
    },
    {
      name: LL().ClassificationPanel.classificationMethods.jenks(),
      value: ClassificationMethod.jenks,
      options: [OptionsClassification.numberOfClasses],
    },
    // {
    //   name: LL().ClassificationPanel.classificationMethods.standardDeviation(),
    //   value: ClassificationMethod.standardDeviation,
    //   options: [OptionsClassification.amplitude, OptionsClassification.meanPosition],
    // },
    {
      name: LL().ClassificationPanel.classificationMethods.geometricProgression(),
      value: ClassificationMethod.geometricProgression,
      options: [OptionsClassification.numberOfClasses],
    },
    {
      name: LL().ClassificationPanel.classificationMethods.nestedMeans(),
      value: ClassificationMethod.nestedMeans,
      options: [OptionsClassification.numberOfClasses],
    },
    {
      name: LL().ClassificationPanel.classificationMethods.manual(),
      value: ClassificationMethod.manual,
      options: [OptionsClassification.breaks],
    },
  ];

  const parameters = classificationPanelStore.classificationParameters as DiscontinuityParameters;

  // The values that we are gonna use for the classification
  const filteredSeries = classificationPanelStore.series!
    .filter((d) => isNumber(d))
    .map((d) => +d);

  const missingValues = classificationPanelStore.series!.length - filteredSeries.length;

  // Basic statistical summary displayed to the user
  const statSummary = prepareStatisticalSummary(filteredSeries);

  // Signals for the current component:
  // - the classification method chosen by the user
  const [
    classificationMethod,
    setClassificationMethod,
  ] = createSignal<ClassificationMethod>(
    parameters.classificationMethod
    || ClassificationMethod.quantiles,
  );
  // - the number of classes chosen by the user for the current classification method
  const [
    numberOfClasses,
    setNumberOfClasses,
  ] = createSignal<number>(
    parameters.classes
    || Mmin(d3.thresholdSturges(filteredSeries), 9),
  );
  // - the breaks chosen by the user for the
  //   current classification method (only if 'manual' is chosen)
  const [
    customBreaks,
    setCustomBreaks,
  ] = createSignal<number[]>(parameters.breaks);
  // - the current breaks (given the last option that changed, or the default breaks)
  const [
    currentBreaksInfo,
    setCurrentBreaksInfo,
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
  ] = createSignal<DiscontinuityParameters>(makeClassificationParameters());
  // - the size for the lines in each class
  const [
    selectedSizes,
    setSelectedSizes,
  ] = createSignal<number[]>(parameters.sizes || []);

  const makeClassificationParameters = (): DiscontinuityParameters => {
    const classifier = new (getClassifier(classificationMethod()))(filteredSeries, null);
    let breaks;
    let classes;
    if (
      !([
        ClassificationMethod.standardDeviation,
        ClassificationMethod.manual,
        ClassificationMethod.q6,
      ].includes(classificationMethod()))
    ) {
      breaks = classifier.classify(numberOfClasses());
      classes = numberOfClasses();
    } else if (classificationMethod() === ClassificationMethod.q6) {
      breaks = classifier.classify();
      classes = 6;
    // } else if (classificationMethod() === ClassificationMethod.standardDeviation) {
    //   breaks = classifier.classify(amplitude(), meanPositionRole() === 'center');
    //   classes = breaks.length - 1;
    } else if (classificationMethod() === ClassificationMethod.manual) {
      breaks = classifier.classify(customBreaks());
      classes = breaks.length - 1;
    } else {
      throw new Error('Classification method not found !');
    }
    const entitiesByClass = classifier.countByClass();

    const p = {
      variable: parameters.variable,
      type: parameters.type,
      classificationMethod: classificationMethod(),
      classes,
      breaks,
      sizes: selectedSizes(),
    };

    return p;
  };

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
          {LL().ClassificationPanel.title()}&nbsp;
          - {classificationPanelStore.layerName}&nbsp;
          - {classificationPanelStore.classificationParameters!.variable}
        </p>
      </header>
      <section class="modal-card-body">
        <div class="is-flex">
          <div style={{ width: '40%', 'text-align': 'center' }}>
            <h3> {LL().ClassificationPanel.summary()}</h3>
            <div>
              <table class="table is-bordered is-striped is-narrow is-hoverable is-fullwidth">
                <tbody>
                <tr>
                  <td>{LL().ClassificationPanel.population()}</td>
                  <td>{statSummary.population}</td>
                </tr>
                <tr>
                  <td>{LL().ClassificationPanel.minimum()}</td>
                  <td>{round(statSummary.minimum, statSummary.precision)}</td>
                </tr>
                <tr>
                  <td>{LL().ClassificationPanel.maximum()}</td>
                  <td>{round(statSummary.maximum, statSummary.precision)}</td>
                </tr>
                <tr>
                  <td>{LL().ClassificationPanel.mean()}</td>
                  <td>{round(statSummary.mean, statSummary.precision)}</td>
                </tr>
                <tr>
                  <td>{LL().ClassificationPanel.median()}</td>
                  <td>{round(statSummary.median, statSummary.precision)}</td>
                </tr>
                <tr>
                  <td>{LL().ClassificationPanel.standardDeviation()}</td>
                  <td>{round(statSummary.standardDeviation, statSummary.precision)}</td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ width: '55%', 'text-align': 'center' }}>
            <h3> {LL().ClassificationPanel.distribution()} </h3>
            <div> {makeDistributionPlot(filteredSeries)} </div>
          </div>
        </div>
        <hr/>
      </section>
      <footer class="modal-card-foot">
        <button
          class="button is-success classification-panel__confirm-button"
          onClick={() => {
            if (classificationPanelStore.onConfirm) {
              classificationPanelStore.onConfirm();
            }
            setClassificationPanelStore({ show: false });
          }}
        >{LL().SuccessButton()}</button>
        <button
          class="button classification-panel__cancel-button"
          onClick={() => {
            if (classificationPanelStore.onCancel) {
              classificationPanelStore.onCancel();
            }
            setClassificationPanelStore({ show: false });
          }}
        >{LL().CancelButton()}</button>
      </footer>
    </div>
  </div>;
}
