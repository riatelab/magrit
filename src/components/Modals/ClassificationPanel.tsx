// Imports from solid-js
import {
  createSignal, JSX, Match, onCleanup,
  onMount, Show, Switch,
} from 'solid-js';

// Imports from other packages
import {
  getPalettes,
  PaletteType,
  getSequentialColors,
  getAsymmetricDivergingColors,
} from 'dicopal';
import toast from 'solid-toast';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import d3 from '../../helpers/d3-custom';
import { getClassifier, parseUserDefinedBreaks, prepareStatisticalSummary } from '../../helpers/classification';
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
  ClassificationMethod,
  type ClassificationParameters,
  type CustomPalette,
} from '../../global.d';

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
    // For now we use 'null' precision, which avoid rounding to occurs in
    // statsbreaks code.
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
    } else if (classificationMethod() === ClassificationMethod.standardDeviation) {
      breaks = classifier.classify(amplitude(), meanPositionRole() === 'center');
      classes = breaks.length - 1;
    } else if (classificationMethod() === ClassificationMethod.manual) {
      breaks = classifier.classify(customBreaks());
      classes = breaks.length - 1;
    } else {
      throw new Error('Classification method not found !');
    }
    const entitiesByClass = classifier.countByClass();
    const palName = paletteName();
    const customPalette = {
      id: `${palName}-${classes}${typeScheme() === 'diverging' ? `-${centralClass()}` : ''}`,
      name: palName,
      number: classes,
      type: typeScheme() as PaletteType,
      provenance: 'dicopal',
      reversed: isPaletteReversed(),
    } as CustomPalette;

    if (typeScheme() === 'sequential') {
      customPalette.colors = getSequentialColors(palName, classes, isPaletteReversed());
    } else if (typeScheme() === 'diverging') {
      const positionCentralClass = centralClass()!;
      customPalette.divergingOptions = {
        left: positionCentralClass,
        right: classes - Number(hasNeutralCentralClass()) - positionCentralClass,
        centralClass: hasNeutralCentralClass(),
        balanced: true,
      };
      customPalette.colors = getAsymmetricDivergingColors(
        palName,
        customPalette.divergingOptions.left,
        customPalette.divergingOptions.right,
        customPalette.divergingOptions.centralClass,
        customPalette.divergingOptions.balanced,
        isPaletteReversed(),
      );
    } else {
      throw new Error('Palette type not found !');
    }
    const cp = {
      variable: classificationPanelStore.classificationParameters!.variable,
      method: classificationMethod(),
      classes,
      breaks,
      palette: customPalette,
      noDataColor: noDataColor(),
      entitiesByClass,
    } as ClassificationParameters;

    if (classificationMethod() === 'standardDeviation') {
      cp.amplitude = amplitude();
      cp.meanPositionRole = meanPositionRole();
    }

    return cp;
  }; /* eslint-enable @typescript-eslint/no-use-before-define */

  const { LL } = useI18nContext();

  // The values that we are gonna use for the classification
  const filteredSeries = classificationPanelStore.series!
    .filter((d) => isNumber(d))
    .map((d) => +d);

  const missingValues = classificationPanelStore.series!.length - filteredSeries.length;

  // Basic statistical summary displayed to the user
  const statSummary = prepareStatisticalSummary(filteredSeries);

  const availableSequentialPalettes = getPalettes({ type: 'sequential', number: 8 })
    .map((d) => ({
      name: `${d.name} (${d.provider})`,
      value: d.name,
    }));

  const availableDivergingPalettes = getPalettes({ type: 'diverging', number: 8 })
    .map((d) => ({
      name: `${d.name} (${d.provider})`,
      value: d.name,
    }));

  // Signals for the current component:
  // - the classification method chosen by the user
  const [
    classificationMethod,
    setClassificationMethod,
  ] = createSignal<ClassificationMethod>(
    classificationPanelStore.classificationParameters!.method
    || ClassificationMethod.quantiles,
  );
  // - the number of classes chosen by the user for the current classification method
  const [
    numberOfClasses,
    setNumberOfClasses,
  ] = createSignal<number>(
    classificationPanelStore.classificationParameters!.classes
    || Mmin(d3.thresholdSturges(filteredSeries), 9),
  );
  // - the amplitude chosen by the user for the
  //   current classification method (only if 'standard deviation' is chosen)
  const [
    amplitude,
    setAmplitude,
  ] = createSignal<number>(
    classificationPanelStore.classificationParameters!.amplitude || 1,
  );
  // - whether the mean position is chosen by the user for the current classification
  //   method (only if 'standard deviation' is chosen)
  const [
    meanPositionRole,
    setMeanPositionRole,
  ] = createSignal<'center' | 'boundary'>(
    classificationPanelStore.classificationParameters!.meanPositionRole || 'center',
  );
  // - the type of color scheme chosen by the user (sequential or diverging)
  const [
    typeScheme,
    setTypeScheme,
  ] = createSignal<'sequential' | 'diverging' | 'custom'>(
    classificationPanelStore.classificationParameters!.palette.type as 'sequential' | 'diverging'
    || 'sequential',
  );
  // - the color palette chosen by the user for the current classification method
  const [
    paletteName,
    setPaletteName,
  ] = createSignal<string>(
    classificationPanelStore.classificationParameters!.palette.name
    || 'Algae',
  );
  // - the color chosen by the user for the no data values
  const [
    noDataColor,
    setNoDataColor,
  ] = createSignal<string>(
    classificationPanelStore.classificationParameters!.noDataColor,
  );
  // - whether to reverse the color palette
  const [
    isPaletteReversed,
    setIsPaletteReversed,
  ] = createSignal<boolean>(
    classificationPanelStore.classificationParameters!.palette.reversed,
  );
  // - the inflection point chosen by the user for the
  //   current classification method (only if 'diverging' is chosen)
  const [
    centralClass,
    setCentralClass,
  ] = createSignal<number | undefined>(
    classificationPanelStore.classificationParameters!.palette.divergingOptions?.left
    || 1,
  );
  // - wheter there is a neutral central class for the diverging palette
  const [
    hasNeutralCentralClass,
    setHasNeutralCentralClass,
  ] = createSignal<boolean>(
    classificationPanelStore.classificationParameters!.palette.divergingOptions?.centralClass
    || false,
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
  let refTextArea: HTMLTextAreaElement;

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

  // const listenerEscKey = (event: KeyboardEvent) => {
  //   const isEscape = event.key
  //     ? (event.key === 'Escape' || event.key === 'Esc')
  //     : (event.keyCode === 27);
  //   if (isEscape) {
  //     (refParentNode.querySelector(
  //       '.classification-panel__cancel-button',
  //     ) as HTMLElement).click();
  //   }
  // };
  //
  // onMount(() => {
  //   // We could set focus on the confirm button when the modal is shown
  //   // as in some other modal, although it is not as important here...
  //   document.body.addEventListener('keydown', listenerEscKey);
  // });
  //
  // onCleanup(() => {
  //   document.body.removeEventListener('keydown', listenerEscKey);
  // });

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
          - {classificationPanelStore.layerName}&nbsp;
          - {classificationPanelStore.classificationParameters!.variable}
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
                    { /* TODO: find a better decimalPlaces value */}
                    <td>{ round(statSummary.minimum, statSummary.precision) }</td>
                  </tr>
                  <tr>
                    <td>{ LL().ClassificationPanel.maximum() }</td>
                    <td>{ round(statSummary.maximum, statSummary.precision) }</td>
                  </tr>
                  <tr>
                    <td>{ LL().ClassificationPanel.mean() }</td>
                    <td>{ round(statSummary.mean, statSummary.precision) }</td>
                  </tr>
                  <tr>
                    <td>{ LL().ClassificationPanel.median() }</td>
                    <td>{ round(statSummary.median, statSummary.precision) }</td>
                  </tr>
                  <tr>
                    <td>{ LL().ClassificationPanel.standardDeviation() }</td>
                    <td>{ round(statSummary.standardDeviation, statSummary.precision) }</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ width: '55%', 'text-align': 'center' }}>
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
                defaultEntry={
                  entriesClassificationMethod
                    .find((d) => d.value === classificationMethod())!
                }
                onChange={(value) => {
                  setClassificationMethod(value as ClassificationMethod);
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
                  onChange={(event) => {
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
                  value={amplitude()}
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
                      checked={meanPositionRole() === 'center'}
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
                      checked={meanPositionRole() === 'boundary'}
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
                  ref={refTextArea!}
                  value={currentBreaksInfo().breaks.join(' - ')}
                >
                </textarea>
                <button
                  class="button"
                  style={{ width: '100%', height: '2em' }}
                  onClick={() => {
                    try {
                      const b = parseUserDefinedBreaks(
                        filteredSeries,
                        refTextArea.value,
                        statSummary,
                      );
                      setCustomBreaks(b);
                    } catch (e) {
                      toast.error(LL().ClassificationPanel.errorCustomBreaks(), {
                        duration: 10000,
                      });
                      refTextArea.value = currentBreaksInfo().breaks.join(' - ');
                      return;
                    }
                    updateClassificationParameters();
                  }}
                >
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
                  {makeColoredBucketPlot(currentBreaksInfo())}
                </div>
                <div class="is-flex is-flex-direction-row is-justify-content-space-around mt-2">
                  <div class="control">
                    <label class="label">
                      <input
                        style={{ 'vertical-align': 'text-bottom' }}
                        type="checkbox"
                        checked={classificationPlotOption().mean}
                        onChange={(e) => {
                          setClassificationPlotOption({
                            ...classificationPlotOption(),
                            mean: e.target.checked,
                          });
                        }}
                      />
                      {LL().ClassificationPanel.displayMean()}
                    </label>
                  </div>
                  <div class="control">
                    <label class="label">
                      <input
                        style={{ 'vertical-align': 'text-bottom' }}
                        type="checkbox"
                        checked={classificationPlotOption().median}
                        onChange={(e) => {
                          setClassificationPlotOption({
                            ...classificationPlotOption(),
                            median: e.target.checked,
                          });
                        }}
                      />
                      {LL().ClassificationPanel.displayMedian()}
                    </label>
                  </div>
                  <div class="control">
                    <label class="label">
                      <input
                        style={{ 'vertical-align': 'text-bottom' }}
                        type="checkbox"
                        checked={classificationPlotOption().sd}
                        onChange={(e) => {
                          setClassificationPlotOption({
                            ...classificationPlotOption(),
                            sd: e.target.checked,
                          });
                        }}
                      />
                      {LL().ClassificationPanel.displayStdDev()}
                    </label>
                  </div>
                </div>
              </div>
              <div style={{ width: '45%', 'text-align': 'left', padding: '0 2em' }}>
                <div style={{ 'flex-grow': 1 }}>
                  <p class="label is-marginless has-text-centered mb-2">
                    {LL().ClassificationPanel.typeScheme()}
                  </p>
                  <div class="is-flex is-justify-content-space-around mt-2">
                    <label class="radio" for="type-scheme-sequential">
                      <input
                        type={'radio'}
                        name={'type-scheme'}
                        id={'type-scheme-sequential'}
                        onChange={() => {
                          setPaletteName(availableSequentialPalettes[0].value);
                          setTypeScheme('sequential');
                          updateClassificationParameters();
                        }}
                        checked={typeScheme() === 'sequential'}
                      />
                      {LL().ClassificationPanel.sequential()}
                    </label>
                    <label class="radio" for="type-scheme-diverging">
                      <input
                        type={'radio'}
                        name={'type-scheme'}
                        id={'type-scheme-diverging'}
                        onChange={() => {
                          setPaletteName(availableDivergingPalettes[0].value);
                          setTypeScheme('diverging');
                          updateClassificationParameters();
                        }}
                        checked={typeScheme() === 'diverging'}
                      />
                      {LL().ClassificationPanel.diverging()}
                    </label>
                  </div>
                </div>
                <br/>
                <div class="is-flex is-justify-content-space-between">
                  <div>
                    <p class="label is-marginless">{LL().ClassificationPanel.palette()}</p>
                    <Switch>
                      <Match when={typeScheme() === 'sequential'}>
                        <DropdownMenu
                          id={'dropdown-palette-name'}
                          style={{ width: '220px' }}
                          entries={availableSequentialPalettes}
                          defaultEntry={
                            availableSequentialPalettes.find((d) => d.value === paletteName())
                            || availableSequentialPalettes[0]
                          }
                          onChange={(value) => {
                            setPaletteName(value);
                            updateClassificationParameters();
                          }}
                        />
                      </Match>
                      <Match when={typeScheme() === 'diverging'}>
                        <DropdownMenu
                          id={'dropdown-palette-name'}
                          style={{ width: '220px' }}
                          entries={availableDivergingPalettes}
                          defaultEntry={
                            availableDivergingPalettes.find((d) => d.value === paletteName())
                            || availableDivergingPalettes[0]
                          }
                          onChange={(value) => {
                            setPaletteName(value);
                            updateClassificationParameters();
                          }}
                        />
                      </Match>
                    </Switch>
                  </div>
                  <div class="control is-flex is-align-items-center mt-4">
                    <label class="label">
                      <input
                        type="checkbox"
                        checked={isPaletteReversed()}
                        onChange={(e) => {
                          setIsPaletteReversed(e.target.checked);
                          updateClassificationParameters();
                        }}
                      />
                      {LL().ClassificationPanel.reversePalette()}
                    </label>
                  </div>
                </div>
                <Show when={missingValues > 0}>
                  <br/>
                  <div class="control is-flex is-align-content-center is-flex-wrap-wrap-reverse">
                    <input
                      class="color mr-5"
                      type="color"
                      value={noDataColor()}
                      onChange={(e) => {
                        setNoDataColor(e.target.value);
                        updateClassificationParameters();
                      }}
                    />
                    <p class="label">
                      {LL().ClassificationPanel.missingValues(missingValues)}
                    </p>
                  </div>
                </Show>
                <br/>
                <Show when={typeScheme() === 'diverging'}>
                  <InputFieldCheckbox
                    label={LL().ClassificationPanel.neutralCentralClass()}
                    checked={hasNeutralCentralClass()}
                    onChange={(v) => {
                      setHasNeutralCentralClass(v);
                      updateClassificationParameters();
                    }}
                  />
                  <InputFieldRangeSlider
                    label={
                      hasNeutralCentralClass()
                        ? LL().ClassificationPanel.centralClassPosition()
                        : LL().ClassificationPanel.inflexionPointPosition()
                    }
                    min={1}
                    max={numberOfClasses() - 1 - Number(hasNeutralCentralClass())}
                    step={1}
                    value={Mround((numberOfClasses() - 1) / 2)}
                    onChange={(value) => {
                      setCentralClass(value);
                      updateClassificationParameters();
                    }}
                    formater={
                      hasNeutralCentralClass()
                        ? (v) => `${v + 1}`
                        : (v) => `${v}`
                    }
                  />
                </Show>
              </div>
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
        >{ LL().CancelButton() }</button>
      </footer>
    </div>
  </div>;
}
