// Imports from solid-js
import {
  createSignal, For, JSX, Match,
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
import { isFiniteNumber } from '../../helpers/common';
import { Mmin, Mround, round } from '../../helpers/math';
import { makeDistributionPlot } from '../DistributionPlots.tsx';

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
  ClassificationMethod,
  type DiscontinuityParameters,
} from '../../global.d';

export default function ClassificationDiscontinuityPanel(): JSX.Element {
  const updateClassificationParameters = () => {
    /* eslint-disable @typescript-eslint/no-use-before-define */
    const cp = makeClassificationParameters();
    setCurrentBreaksInfo(cp);
    setCustomBreaks(cp.breaks);
    setNumberOfClasses(cp.classes);
    setSelectedSizes(cp.sizes);
    /* eslint-enable @typescript-eslint/no-use-before-define */
  };

  const makeClassificationParameters = (): DiscontinuityParameters => {
    /* eslint-disable @typescript-eslint/no-use-before-define */
    const classifier = new (getClassifier(classificationMethod()))(filteredSeries, null);
    let breaks;
    let classes;
    if (
      !([
        // ClassificationMethod.standardDeviation,
        ClassificationMethod.headTail,
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
    } else if (classificationMethod() === ClassificationMethod.headTail) {
      breaks = classifier.classify();
      classes = breaks.length - 1;
    } else if (classificationMethod() === ClassificationMethod.manual) {
      breaks = classifier.classify(customBreaks());
      classes = breaks.length - 1;
    } else {
      throw new Error('Classification method not found !');
    }
    const entitiesByClass = classifier.countByClass();

    const sizes: number[] = [];
    if (classes > selectedSizes().length) {
      sizes.push(...selectedSizes());
      for (let i = 0; i < classes - selectedSizes().length; i += 1) {
        sizes.push(sizes[sizes.length - 1] + 1 + i);
      }
    } else if (classes < selectedSizes().length) {
      sizes.push(...selectedSizes().slice(0, classes));
    } else {
      sizes.push(...selectedSizes());
    }

    const p = {
      variable: parameters.variable,
      type: parameters.type,
      classificationMethod: classificationMethod(),
      classes,
      breaks,
      sizes,
    };
    /* eslint-enable @typescript-eslint/no-use-before-define */
    return p;
  };

  let refParentNode: HTMLDivElement;
  const { LL } = useI18nContext();

  const parameters = classificationPanelStore.classificationParameters as DiscontinuityParameters;

  // The values that we are gonna use for the classification
  const filteredSeries = classificationPanelStore.series!
    .filter((d) => isFiniteNumber(d))
    .map((d) => +d);

  const missingValues = classificationPanelStore.series!.length - filteredSeries.length;

  const allValuesSuperiorToZero = filteredSeries.every((d) => d > 0);

  // Basic statistical summary displayed to the user
  const statSummary = prepareStatisticalSummary(filteredSeries);

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
    statSummary.unique > 6 ? {
      name: LL().ClassificationPanel.classificationMethods.q6(),
      value: ClassificationMethod.q6,
      options: [],
    } : null,
    {
      name: LL().ClassificationPanel.classificationMethods.ckmeans(),
      value: ClassificationMethod.ckmeans,
      options: [OptionsClassification.numberOfClasses],
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
    allValuesSuperiorToZero ? {
      name: LL().ClassificationPanel.classificationMethods.geometricProgression(),
      value: ClassificationMethod.geometricProgression,
      options: [OptionsClassification.numberOfClasses],
    } : null,
    {
      name: LL().ClassificationPanel.classificationMethods.nestedMeans(),
      value: ClassificationMethod.nestedMeans,
      options: [OptionsClassification.numberOfClasses],
    },
    {
      name: LL().ClassificationPanel.classificationMethods.headTail(),
      value: ClassificationMethod.headTail,
      options: [],
    },
    {
      name: LL().ClassificationPanel.classificationMethods.manual(),
      value: ClassificationMethod.manual,
      options: [OptionsClassification.breaks],
    },
  ].filter((d) => d !== null);

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
  // - the size for the lines in each class
  const [
    selectedSizes,
    setSelectedSizes,
  ] = createSignal<number[]>(parameters.sizes || []);
  // - the current breaks info
  const [
    currentBreaksInfo,
    setCurrentBreaksInfo,
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
  ] = createSignal<DiscontinuityParameters>(makeClassificationParameters());

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
      <section class="modal-card-body" style={{ 'padding-bottom': '4em' }}>
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
        <div style={{ 'text-align': 'center' }}>
          <h3> {LL().ClassificationPanel.classification()} </h3>
          <div class={'is-flex is-flex-direction-row is-justify-content-space-evenly mb-5'}>
            <div style={{ 'flex-grow': 1 }}>
              <p class="label is-marginless">{LL().ClassificationPanel.classificationMethod()}</p>
              <DropdownMenu
                id={'dropdown-classification-method'}
                style={{ width: '220px' }}
                entries={entriesClassificationMethod}
                defaultEntry={
                  entriesClassificationMethod
                    .find((d) => d.value === classificationMethod())!
                }
                onChange={(value) => {
                  setClassificationMethod(value as ClassificationMethod);
                  // If the classification method is nestedMeans, we need to force
                  // the number of classes to be a power of 2.
                  if (value === ClassificationMethod.nestedMeans) {
                    setNumberOfClasses(2 ** Math.round(Math.log2(numberOfClasses())));
                  }
                  updateClassificationParameters();
                }}
              />
            </div>
            <Show
              when={
                classificationMethodHasOption(
                  OptionsClassification.numberOfClasses,
                  classificationMethod(),
                  entriesClassificationMethod,
                )
              }
              fallback={<div style={{ 'flex-grow': 2 }}><p></p></div>}
            >
              <div style={{ 'flex-grow': 2 }}>
                <p class="label is-marginless">{LL().ClassificationPanel.numberOfClasses()}</p>
                <input
                  class={'input'}
                  type={'number'}
                  value={numberOfClasses()}
                  min={3}
                  max={9}
                  onChange={(event) => {
                    // If the current method is 'nestedMeans', we need to force
                    // the number of classes to be a power of 2.
                    let v = +event.target.value;
                    if (classificationMethod() === ClassificationMethod.nestedMeans) {
                      v = 2 ** Math.round(Math.log2(v));
                      // eslint-disable-next-line no-param-reassign
                      event.target.value = `${v}`;
                    }
                    setNumberOfClasses(v);
                    updateClassificationParameters();
                  }}
                />
              </div>
            </Show>
          </div>
          <div>
            <div class="is-flex is-flex-direction-column is-justify-content-center">
              <div class="is-flex is-flex-direction-row is-justify-content-center">
                <div style={{ width: '160px' }}>{LL().ClassificationPanel.lowerLimit()}</div>
                <div style={{ width: '160px' }}>{LL().ClassificationPanel.upperLimit()}</div>
                <div style={{ width: '160px' }}>{LL().ClassificationPanel.size()}</div>
              </div>
              <For each={selectedSizes()}>
                {
                  (size, index) => <div class="is-flex is-flex-direction-row is-justify-content-center">
                    <input
                      type="number"
                      style={{ width: '160px' }}
                      disabled={classificationMethod() !== ClassificationMethod.manual}
                      value={round(customBreaks()[index()], statSummary.precision)}
                      step={parseFloat(`1e-${statSummary.precision}`)}
                      onChange={(ev) => {
                        // is the selected boundary greater than the previous one?
                        // is the selected boundary smaller than the next one?
                        if (
                          ev.target.value === ''
                          || +ev.target.value <= (customBreaks()[index() - 1] || -Infinity)
                          || +ev.target.value >= customBreaks()[index() + 1]
                        ) {
                          // rollback to the previous value
                          // eslint-disable-next-line no-param-reassign
                          ev.target.value = `${round(customBreaks()[index()], statSummary.precision)}`;
                          return;
                        }
                        const v = +ev.target.value;
                        const b = customBreaks().map((d, i) => (i === index() ? v : d));
                        setCustomBreaks(b);
                        updateClassificationParameters();
                      }}
                    />
                    <input
                      type="number"
                      style={{ width: '160px' }}
                      disabled={classificationMethod() !== ClassificationMethod.manual}
                      value={round(customBreaks()[index() + 1], statSummary.precision)}
                      step={parseFloat(`1e-${statSummary.precision}`)}
                      onChange={(ev) => {
                        // is the selected boundary smaller than the next one?
                        // is the selected boundary greater than the next one?
                        if (
                          ev.target.value === ''
                          || +ev.target.value >= (customBreaks()[index() + 2] || +Infinity)
                          || +ev.target.value <= customBreaks()[index()]
                        ) {
                          // rollback to the previous value
                          // eslint-disable-next-line no-param-reassign
                          ev.target.value = `${round(customBreaks()[index() + 1], statSummary.precision)}`;
                          return;
                        }
                        const v = +ev.target.value;
                        const b = customBreaks().map((d, i) => (i === (index() + 1) ? v : d));
                        setCustomBreaks(b);
                        updateClassificationParameters();
                      }}
                    />
                    <input
                      type="number"
                      style={{ width: '160px' }}
                      min={index() === 0 ? 0 : selectedSizes()[index() - 1]}
                      max={selectedSizes()[index() + 1]}
                      value={size}
                      onChange={(event) => {
                        if (
                          event.target.value === ''
                          || +event.target.value < 0
                        ) {
                          // eslint-disable-next-line no-param-reassign
                          event.target.value = `${size}`;
                          return;
                        }
                        const v = +event.target.value;
                        setSelectedSizes(selectedSizes().map((d, i) => (i === index() ? v : d)));
                        updateClassificationParameters();
                      }}
                    />
                  </div>
                }
              </For>
            </div>
          </div>
        </div>
      </section>
      <footer class="modal-card-foot">
        <button
          class="button is-success classification-panel__confirm-button"
          onClick={() => {
            if (classificationPanelStore.onConfirm) {
              classificationPanelStore.onConfirm(currentBreaksInfo());
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
