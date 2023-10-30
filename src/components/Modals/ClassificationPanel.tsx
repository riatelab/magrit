// Imports from solid-js
import {
  createSignal, JSX, onCleanup, onMount, Show,
} from 'solid-js';

// Imports from other packages
import { getPalette, getPalettes } from 'dicopal';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import d3 from '../../helpers/d3-custom';
import { getClassifier } from '../../helpers/classification';
import { isNumber } from '../../helpers/common';
import {
  extent, hasNegative, Mmin, round,
} from '../../helpers/math';
import { makeClassificationPlot, makeColoredBucketPlot, makeDistributionPlot } from '../DistributionPlots.tsx';

// Sub-components
import DropdownMenu from '../DropdownMenu.tsx';

// Store
import { classificationPanelStore, setClassificationPanelStore } from '../../store/ClassificationPanelStore';

// Styles
import '../../styles/ClassificationPanel.css';

// Types, interfaces and enums
import { ClassificationMethod, type ClassificationParameters } from '../../global.d';

enum OptionsClassification {
  numberOfClasses,
  amplitude,
  meanPosition,
  breaks,
}

const classificationMethodHasOption = (
  option: OptionsClassification,
  method: ClassificationMethod,
  entries: { value: ClassificationMethod, name: any, options: OptionsClassification[] }[],
): boolean => {
  const t = entries.find((e) => e.value === method);
  if (!t || !t.options) {
    return false;
  }
  return t.options.includes(option);
};

function prepareStatisticalSummary(series: number[]) {
  const [min, max] = extent(series);

  return {
    population: series.length,
    minimum: min,
    maximum: max,
    mean: d3.mean(series) as number,
    median: d3.median(series) as number,
    standardDeviation: d3.deviation(series) as number,
    // variance: d3.variance(series),
    // varianceCoefficient: d3.deviation(series) / d3.mean(series),
  };
}

function parseUserDefinedBreaks(series: number[], breaksString: string): number[] {
  const separator = hasNegative(series) ? '- ' : '-';
  const breaks = breaksString.split(separator).map((d) => +d);
  if (breaks.length < 2) {
    throw new Error('The number of breaks must be at least 2.');
  }
  return breaks;
}

export default function ClassificationPanel(): JSX.Element {
  // Function to recompute the classification given the current options.
  // We scope it here to facilitate the use of the signals that are defined below...

  const updateClassificationParameters = () => {
    /* eslint-disable @typescript-eslint/no-use-before-define */
    const cp = makeClassificationParameters();
    setCurrentBreaksInfo(cp);
    setCustomBreaks(cp.breaks);
    setNumberOfClasses(cp.classes);
    /* eslint-enable @typescript-eslint/no-use-before-define */
  };

  const makeClassificationParameters = (): ClassificationParameters => {
    /* eslint-disable @typescript-eslint/no-use-before-define */
    const classifier = new (getClassifier(classificationMethod()))(filteredSeries);
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
    } else if (classificationMethod() === ClassificationMethod.standardDeviation) {
      breaks = classifier.classify(amplitude(), meanPositionRole() === 'center');
      classes = breaks.length - 1;
    } else if (classificationMethod() === ClassificationMethod.manual) {
      breaks = parseUserDefinedBreaks(filteredSeries, customBreaks());
      classes = breaks.length - 1;
    }
    const entitiesByClass = classifier.countByClass();
    const palName = paletteName();
    const palette = getPalette(palName, classes);
    const reversePalette = isPaletteReversed();
    if (!palette) {
      throw new Error('Palette not found !');
    }

    const classificationParameters = {
      variable: classificationPanelStore.variableName,
      method: classificationMethod(),
      classes,
      breaks,
      palette,
      nodataColor: noDataColor(),
      entitiesByClass,
      reversePalette,
    } as ClassificationParameters;

    return classificationParameters;
  }; /* eslint-enable @typescript-eslint/no-use-before-define */

  const { LL } = useI18nContext();

  // The values that we are gonna use for the classification
  const filteredSeries = classificationPanelStore.series
    .filter((d) => isNumber(d))
    .map((d) => +d);

  const missingValues = classificationPanelStore.series.length - filteredSeries.length;

  // Basic statistical summary displayed to the user
  const statSummary = prepareStatisticalSummary(filteredSeries);

  const availablePalettes = getPalettes({ type: 'sequential', number: 9 })
    .map((d) => ({
      name: `${d.name} (${d.provider})`,
      value: d.name,
    }));

  // Signals for the current component:
  // - the classification method chosen by the user
  const [
    classificationMethod,
    setClassificationMethod,
  ] = createSignal<ClassificationMethod>(ClassificationMethod.quantiles);
  // - the number of classes chosen by the user for the current classification method
  const [
    numberOfClasses,
    setNumberOfClasses,
  ] = createSignal<number>(Mmin(d3.thresholdSturges(filteredSeries), 9));
  // - the amplitude chosen by the user for the
  //   current classification method (only if 'standard deviation' is chosen)
  const [
    amplitude,
    setAmplitude,
  ] = createSignal<number>(1);
  // - whether the mean position is chosen by the user for the current classification
  //   method (only if 'standard deviation' is chosen)
  const [
    meanPositionRole,
    setMeanPositionRole,
  ] = createSignal<'center' | 'boundary'>('center');
  // - the color palette chosen by the user for the current classification method
  const [
    paletteName,
    setPaletteName,
  ] = createSignal<string>(classificationPanelStore.colorScheme || 'Algae');
  // - the color chosen by the user for the no data values
  const [
    noDataColor,
    setNoDataColor,
  ] = createSignal<string>('#bebebe');
  // - whether to reverse the color palette
  const [
    isPaletteReversed,
    setIsPaletteReversed,
  ] = createSignal<boolean>(
    classificationPanelStore.invertColorScheme !== undefined
      ? classificationPanelStore.invertColorScheme
      : false,
  );
  // - the current breaks (given the last option that changed, or the default breaks)
  const [
    currentBreaksInfo,
    setCurrentBreaksInfo,
  ] = createSignal<ClassificationParameters>(makeClassificationParameters());
  // - the breaks chosen by the user for the
  //   current classification method (only if 'manual' is chosen)
  const [
    customBreaks,
    setCustomBreaks,
  ] = createSignal<number[]>(currentBreaksInfo().breaks);
  // - display option for the classification plot
  const [
    classificationPlotOption,
    setClassificationPlotOption,
  ] = createSignal<{ median: boolean, mean: boolean, sd: boolean }>({
    median: false,
    mean: false,
    sd: false,
  });

  let refParentNode: HTMLDivElement;

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
    {
      name: LL().ClassificationPanel.classificationMethods.standardDeviation(),
      value: ClassificationMethod.standardDeviation,
      options: [OptionsClassification.amplitude, OptionsClassification.meanPosition],
    },
    {
      name: LL().ClassificationPanel.classificationMethods.geometricProgression(),
      value: ClassificationMethod.geometricProgression,
      options: [OptionsClassification.numberOfClasses],
    },
    {
      name: LL().ClassificationPanel.classificationMethods.manual(),
      value: ClassificationMethod.manual,
      options: [OptionsClassification.breaks],
    },
  ];

  const listenerEscKey = (event: KeyboardEvent) => {
    const isEscape = event.key
      ? (event.key === 'Escape' || event.key === 'Esc')
      : (event.keyCode === 27);
    if (isEscape) {
      (refParentNode.querySelector('.classification-panel__cancel-button') as HTMLElement).click();
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

  return <div class="modal-window modal classification-panel" style={{ display: 'flex' }} ref={refParentNode}>
    <div class="modal-background" />
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">
          { LL().ClassificationPanel.title() }&nbsp;
          - {classificationPanelStore.layerName}&nbsp;
          - {classificationPanelStore.variableName}
        </p>
      </header>
      <section class="modal-card-body">
        <div class="is-flex">
          <div style={{ width: '40%', 'text-align': 'center' }}>
            <h3> { LL().ClassificationPanel.summary() }</h3>
            <div>
              <table class="table is-bordered is-striped is-narrow is-hoverable is-fullwidth">
                <tbody>
                  <tr>
                    <td>{ LL().ClassificationPanel.population() }</td>
                    <td>{ statSummary.population }</td>
                  </tr>
                  <tr>
                    <td>{ LL().ClassificationPanel.minimum() }</td>
                    <td>{ round(statSummary.minimum, 2) }</td>
                  </tr>
                  <tr>
                    <td>{ LL().ClassificationPanel.maximum() }</td>
                    <td>{ round(statSummary.maximum, 2) }</td>
                  </tr>
                  <tr>
                    <td>{ LL().ClassificationPanel.mean() }</td>
                    <td>{ round(statSummary.mean, 2) }</td>
                  </tr>
                  <tr>
                    <td>{ LL().ClassificationPanel.median() }</td>
                    <td>{ round(statSummary.median, 2) }</td>
                  </tr>
                  <tr>
                    <td>{ LL().ClassificationPanel.standardDeviation() }</td>
                    <td>{ round(statSummary.standardDeviation, 2) }</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ width: '60%', 'text-align': 'center' }}>
            <h3> { LL().ClassificationPanel.distribution() } </h3>
            <div> { makeDistributionPlot(filteredSeries) } </div>
          </div>
        </div>
        <hr />
        <div style={{ 'text-align': 'center' }}>
          <h3> { LL().ClassificationPanel.classification() } </h3>
          <div class={'is-flex is-flex-direction-row is-justify-content-space-evenly mb-5'}>
            <div style={{ 'flex-grow': 1 }}>
              <p class="label is-marginless">{ LL().ClassificationPanel.classificationMethod() }</p>
              <DropdownMenu
                id={'dropdown-classification-method'}
                style={{ width: '220px' }}
                entries={entriesClassificationMethod}
                defaultEntry={entriesClassificationMethod[0]}
                onChange={(value) => {
                  setClassificationMethod(value);
                  updateClassificationParameters();
                }}
              />
            </div>
            <Show when={
              classificationMethodHasOption(
                OptionsClassification.numberOfClasses,
                classificationMethod(),
                entriesClassificationMethod,
              )
            }>
              <div style={{ 'flex-grow': 2 }}>
                <p class="label is-marginless">{ LL().ClassificationPanel.numberOfClasses() }</p>
                <input
                  class={'input'}
                  type={'number'}
                  value={numberOfClasses()}
                  min={3}
                  max={9}
                  onchange={(event) => {
                    setNumberOfClasses(+event.target.value);
                    updateClassificationParameters();
                  }}
                />
              </div>
            </Show>
            <Show when={
              classificationMethodHasOption(
                OptionsClassification.amplitude,
                classificationMethod(),
                entriesClassificationMethod,
              )
            }>
              <div style={{ 'flex-grow': 2 }}>
                <p class="label is-marginless">{ LL().ClassificationPanel.amplitude() }</p>
                <input
                  class={'input'}
                  type={'number'}
                  value={1}
                  min={0.1}
                  max={10}
                  step={0.1}
                  onChange={(event) => {
                    setAmplitude(+event.target.value);
                    updateClassificationParameters();
                  }}
                />
                <span>{ LL().ClassificationPanel.howManyStdDev() }</span>
              </div>
            </Show>
            <Show when={
              classificationMethodHasOption(
                OptionsClassification.meanPosition,
                classificationMethod(),
                entriesClassificationMethod,
              )
            }>
              <div style={{ 'flex-grow': 2 }}>
                <p class="label is-marginless">{ LL().ClassificationPanel.meanPosition() }</p>
                <div class="control">
                  <label class="radio" for="mean-position-center">
                    <input
                      type={'radio'}
                      name={'mean-position'}
                      id={'mean-position-center'}
                      onChange={() => {
                        setMeanPositionRole('center');
                        updateClassificationParameters();
                      }}
                      checked
                    />
                    { LL().ClassificationPanel.meanPositionCenter() }
                  </label>
                  <label class="radio" for="mean-position-break">
                    <input
                      type={'radio'}
                      name={'mean-position'}
                      id={'mean-position-break'}
                      onChange={() => {
                        setMeanPositionRole('boundary');
                        updateClassificationParameters();
                      }}
                    />
                    { LL().ClassificationPanel.meanPositionBoundary() }
                  </label>
                </div>
              </div>
            </Show>
            <Show when={
              classificationMethodHasOption(
                OptionsClassification.breaks,
                classificationMethod(),
                entriesClassificationMethod,
              )
            }>
              <div style={{ 'flex-grow': 5 }}>
                <p class="label is-marginless">{ LL().ClassificationPanel.breaksInput() }</p>
                <textarea
                  class={'textarea'}
                  style={{ 'min-height': '3em', 'max-height': '6em' }}
                >
                  { currentBreaksInfo().breaks.join(' - ') }
                </textarea>
                <button class="button" style={{ width: '100%', height: '2em' }}>
                  { LL().ClassificationPanel.validate() }
                </button>
              </div>
            </Show>
          </div>
          <div>
            <p>{ currentBreaksInfo().breaks.join(' - ')}</p>
            <div class="is-flex">
              <div style={{ width: '60%' }}>
                <div>
                  {
                    makeClassificationPlot(
                      currentBreaksInfo(),
                      statSummary,
                      classificationPlotOption(),
                    )
                  }
                </div>
                <div>
                  { makeColoredBucketPlot(currentBreaksInfo()) }
                </div>
              </div>
              <div style={{ width: '40%', 'text-align': 'left', padding: '2em' }}>
                <div style={{ 'flex-grow': 1 }}>
                  <p class="label is-marginless">{ LL().ClassificationPanel.palette() }</p>
                  <DropdownMenu
                    id={'dropdown-palette-name'}
                    style={{ width: '220px' }}
                    entries={availablePalettes}
                    defaultEntry={
                      availablePalettes.find((d) => d.value === paletteName())!
                    }
                    onChange={(value) => {
                      setPaletteName(value);
                      updateClassificationParameters();
                    }}
                  />
                </div>
                <br />
                <div class="control">
                  <label class="label">
                    <input
                      type="checkbox"
                      checked={ isPaletteReversed() }
                      onChange={(e) => {
                        setIsPaletteReversed(e.target.checked);
                        updateClassificationParameters();
                      }}
                    />
                    { LL().ClassificationPanel.reversePalette() }
                  </label>
                </div>
                <br />
                <div class="control">
                  <label class="label">
                    <input
                      type="checkbox"
                      checked={ classificationPlotOption().mean }
                      onChange={(e) => {
                        setClassificationPlotOption({
                          ...classificationPlotOption(),
                          mean: e.target.checked,
                        });
                      }}
                    />
                    { LL().ClassificationPanel.displayMean() }
                  </label>
                </div>
                <div class="control">
                  <label class="label">
                    <input
                      type="checkbox"
                      checked={ classificationPlotOption().median }
                      onChange={(e) => {
                        setClassificationPlotOption({
                          ...classificationPlotOption(),
                          median: e.target.checked,
                        });
                      }}
                    />
                    { LL().ClassificationPanel.displayMedian() }
                  </label>
                </div>
                <div class="control">
                  <label class="label">
                    <input
                      type="checkbox"
                      checked={ classificationPlotOption().sd }
                      onChange={(e) => {
                        setClassificationPlotOption({
                          ...classificationPlotOption(),
                          sd: e.target.checked,
                        });
                      }}
                    />
                    { LL().ClassificationPanel.displayStdDev() }
                  </label>
                </div>
              </div>
            </div>
            <Show when={missingValues > 0}>
              <p class="label">{ LL().ClassificationPanel.missingValues(missingValues) }</p>
              <div class="control">
                <input
                  class="color"
                  type="color"
                  value={ noDataColor() }
                  onChange={(e) => {
                    setNoDataColor(e.target.value);
                    updateClassificationParameters();
                  }}
                />
              </div>
            </Show>
          </div>
        </div>

      </section>
      <footer class="modal-card-foot">
        <button
          class="button is-success classification-panel__confirm-button"
          onClick={() => {
            classificationPanelStore.onConfirm(currentBreaksInfo());
            setClassificationPanelStore({ show: false });
          }}
        >{ LL().SuccessButton() }</button>
        <button
          class="button classification-panel__cancel-button"
          onClick={() => {
            classificationPanelStore.onCancel();
            setClassificationPanelStore({ show: false });
          }}
        >{ LL().CancelButton() }</button>
      </footer>
    </div>
  </div>;
}
