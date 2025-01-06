// Imports from solid-js
import {
  createSignal, JSX, For,
  Match, onCleanup, onMount,
  Show, Switch,
} from 'solid-js';

// Imports from other packages
import {
  getAsymmetricDivergingColors,
  getPalettes,
  getSequentialColors,
  PaletteType,
} from 'dicopal';
import toast from 'solid-toast';
import { AiOutlineCopy } from 'solid-icons/ai';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import d3 from '../../helpers/d3-custom';
import {
  classificationMethodHasOption,
  getClassifier,
  OptionsClassification,
  prepareStatisticalSummary,
} from '../../helpers/classification';
import {
  isEqual, isFiniteNumber,
  isGreaterThan, isLessThan, unproxify,
} from '../../helpers/common';
import { Mmin, Mround, round } from '../../helpers/math';
import { interpolateColors } from '../../helpers/color';
import { makeClassificationPlot, makeColoredBucketPlot, makeDistributionPlot } from '../DistributionPlots.tsx';
import * as PaletteThumbnails from '../../helpers/palette-thumbnail';

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
import InputConstrainedSlider from '../Inputs/InputConstrainedSlider.tsx';

// Component for choosing breaks manually
function ManualBreaks(
  props: {
    currentBreaksInfo: ClassificationParameters,
    setCurrentBreaksInfo: (cp: ClassificationParameters) => void,
    statSummary: ReturnType<typeof prepareStatisticalSummary>,
  },
): JSX.Element {
  const { LL } = useI18nContext();
  const displayWarningDontCoverSeries = () => {
    toast.success(LL().ClassificationPanel.pastedBreaksDontCoverSeries(), {
      style: {
        background: '#1f2937',
        color: '#f3f4f6',
      },
      iconTheme: {
        primary: '#38bdf8',
        secondary: '#1f2937',
      },
    });
  };
  return <div class="mb-2">
    <For each={props.currentBreaksInfo.breaks}>
      {
        (b, i) => <input
          type="number"
          value={round(b, props.statSummary.precision)}
          onPaste={(e) => {
            // Get the pasted data
            const pastedData = e.clipboardData && e.clipboardData.getData('text');
            if (!pastedData || !pastedData.includes('- ')) {
              // The user is not pasting breaks, maybe a single number
              // so we return and the default behavior will be applied
              return;
            }
            // We don't want to update the value if the user is pasting breaks
            e.preventDefault();
            // We split the pasted data by '- ' and we map the values to numbers
            const newBreaks = pastedData
              .split('- ')
              .map((d) => +(d.trim()));
            // Do we have things that look like numbers ?
            if (!newBreaks.every((d) => isFiniteNumber(d))) {
              // Display an error to the user, we need only numbers separated by ' - '
              toast.error(LL().ClassificationPanel.pastedBreaksInvalid());
              return;
            }
            if (newBreaks.length < 3) {
              // Display an error to the user, we need at least 2 classes
              toast.error(LL().ClassificationPanel.pastedBreaksInvalid());
              return;
            }
            // A flag in case the breaks don't cover the whole series
            let dontCoverSeries = false;
            // We have to be careful that the breaks are sorted
            newBreaks.sort((aa, bb) => aa - bb);
            // The first value can be inferior to the minimum
            // but the first value can't be superior to the minimum
            if (
              isEqual(newBreaks[0], props.statSummary.minimum, props.statSummary.precision)
            ) {
              // Replace the first value by the (real) minimum
              newBreaks[0] = props.statSummary.minimum;
            } else if (
              isGreaterThan(newBreaks[0], props.statSummary.minimum, props.statSummary.precision)
            ) {
              newBreaks.unshift(props.statSummary.minimum);
              dontCoverSeries = true;
            }
            // The last value can be superior to the maximum
            // but the last value can't be inferior to the maximum
            if ( // eslint-disable-next-line max-len
              isEqual(newBreaks[newBreaks.length - 1], props.statSummary.maximum, props.statSummary.precision)
            ) {
              // Replace the last value by the (real) maximum
              newBreaks[newBreaks.length - 1] = props.statSummary.maximum;
            } else if ( // eslint-disable-next-line max-len
              isLessThan(newBreaks[newBreaks.length - 1], props.statSummary.maximum, props.statSummary.precision)
            ) {
              newBreaks.push(props.statSummary.maximum);
              dontCoverSeries = true;
            }
            if (dontCoverSeries) {
              // Display a warning to the user but we still update the breaks
              displayWarningDontCoverSeries();
            }
            // Update the breaks
            props.setCurrentBreaksInfo({
              ...props.currentBreaksInfo,
              classes: newBreaks.length - 1,
              breaks: newBreaks,
            });
          }}
          onChange={(e) => {
            // We don't want to update the breaks if the user is typing
            // a number that is not a valid number or if the value is superior
            // to the next break or inferior to the previous break.
            const value = +e.target.value;
            const self = e.currentTarget;
            if (
              !isFiniteNumber(value)
              || (i() < props.currentBreaksInfo.breaks.length - 1
                && value >= props.currentBreaksInfo.breaks[i() + 1])
              || (i() > 0
                && value <= props.currentBreaksInfo.breaks[i() - 1])
            ) {
              // eslint-disable-next-line no-param-reassign
              self.value = `${round(b, props.statSummary.precision)}`;
              return;
            }
            // If this is the first break value, we accept values inferior to the minimum
            // but we don't accept values superior to the minimum
            // (the whole series should be covered)
            if (i() === 0) {
              if (isEqual(value, props.statSummary.minimum, props.statSummary.precision)) {
                // Replace the first value by the (real) minimum
                const newBreaks = [
                  props.statSummary.minimum,
                  ...props.currentBreaksInfo.breaks.slice(1),
                ];
                props.setCurrentBreaksInfo({
                  ...props.currentBreaksInfo,
                  breaks: newBreaks,
                });
                // eslint-disable-next-line no-param-reassign
                self.value = `${round(props.statSummary.minimum, props.statSummary.precision)}`;
              } else if (
                isGreaterThan(value, props.statSummary.minimum, props.statSummary.precision)
              ) {
                // Replace the first value by the minimum
                const newBreaks = [
                  props.statSummary.minimum,
                  ...props.currentBreaksInfo.breaks.slice(1),
                ];
                props.setCurrentBreaksInfo({
                  ...props.currentBreaksInfo,
                  breaks: newBreaks,
                });
                // eslint-disable-next-line no-param-reassign
                self.value = `${round(props.statSummary.minimum, props.statSummary.precision)}`;
                // Inform the user that the series should be covered
                // and that we adjusted the breaks
                displayWarningDontCoverSeries();
                return;
              }
            }
            // If this is the last break value, we accept values superior to the maximum
            // but we don't accept values inferior to the maximum
            // (the whole series should be covered)
            if (i() === props.currentBreaksInfo.breaks.length - 1) {
              if (isEqual(value, props.statSummary.maximum, props.statSummary.precision)) {
                // Replace the last value by the (real) maximum
                const newBreaks = [
                  ...props.currentBreaksInfo.breaks.slice(0, -1),
                  props.statSummary.maximum,
                ];
                props.setCurrentBreaksInfo({
                  ...props.currentBreaksInfo,
                  breaks: newBreaks,
                });
                // eslint-disable-next-line no-param-reassign
                self.value = `${round(props.statSummary.maximum, props.statSummary.precision)}`;
              } else if (
                isLessThan(value, props.statSummary.maximum, props.statSummary.precision)
              ) {
                // Replace the last value by the maximum
                const newBreaks = [
                  ...props.currentBreaksInfo.breaks.slice(0, -1),
                  props.statSummary.maximum,
                ];
                props.setCurrentBreaksInfo({
                  ...props.currentBreaksInfo,
                  breaks: newBreaks,
                });
                // eslint-disable-next-line no-param-reassign
                self.value = `${round(props.statSummary.maximum, props.statSummary.precision)}`;
                // Inform the user that the series should be covered
                // and that we adjusted the breaks
                displayWarningDontCoverSeries();
                return;
              }
            }
            // Nothing went wrong, we can update the breaks
            const newBreaks = [...props.currentBreaksInfo.breaks];
            newBreaks[i()] = value;
            props.setCurrentBreaksInfo({
              ...props.currentBreaksInfo,
              breaks: newBreaks,
            });
          }}
        />
      }
    </For>
    <AiOutlineCopy
      size={18}
      title={LL().ClassificationPanel.copyBreaks()}
      class="is-clickable copy-breaks ml-4"
      onClick={() => {
        // Copy the breaks to the clipboard and display a success message
        navigator.clipboard.writeText(
          props.currentBreaksInfo.breaks
            .map((d) => round(d, props.statSummary.precision))
            .join(' - '),
        );
        toast.success(LL().ClassificationPanel.breaksCopied());
      }}
    />
  </div>;
}

// Component for creating custom palettes
function CustomPaletteCreation(
  props: {
    currentBreaksInfo: ClassificationParameters,
    setCurrentBreaksInfo: (cp: ClassificationParameters) => void,
  },
): JSX.Element {
  const { LL } = useI18nContext();
  return <div class="is-overflow-x-auto">
    <div
      class="mt-2 is-flex is-justify-content-space-around"
      style={{ width: props.currentBreaksInfo.classes < 9 ? 'auto' : 'max-content' }}
    >
      <For each={props.currentBreaksInfo.palette.colors}>
        {
          (c, i) => <>
            <input
              // We want the minimum padding to avoid the color picker to be too big
              style={{
                padding: '0.1rem',
                'border-width': '0',
                width: `${425 / 9}px`,
              }}
              type="color"
              value={c}
              onChange={(e) => {
                const newColors = [...props.currentBreaksInfo.palette.colors];
                newColors[i()] = e.target.value;
                props.setCurrentBreaksInfo({
                  ...props.currentBreaksInfo,
                  palette: {
                    ...props.currentBreaksInfo.palette,
                    colors: newColors,
                  },
                });
              }}
            />
          </>
        }
      </For>
    </div>
    <div
      class="is-flex is-justify-content-space-around"
      style={{ width: props.currentBreaksInfo.classes < 9 ? 'auto' : 'max-content' }}
    >
      <For each={props.currentBreaksInfo.palette.colors}>
        {
          (c, i) => <>
            <input
              type="text"
              style={{
                width: `${425 / 9}px`,
                'font-size': '0.7rem',
              }}
              value={c}
              onChange={(e) => {
                if (!/^#[0-9a-f]{6}$/i.test(e.target.value)) {
                  // Display an error to the user, we need only colors
                  toast.error(LL().ClassificationPanel.inputColorInvalid());
                  // Rollback to the previous value
                  // eslint-disable-next-line no-param-reassign
                  e.currentTarget.value = c;
                  return;
                }
                // If the color is valid, we update the colors to take it
                // into account
                const newColors = [...props.currentBreaksInfo.palette.colors];
                newColors[i()] = e.target.value;
                props.setCurrentBreaksInfo({
                  ...props.currentBreaksInfo,
                  palette: {
                    ...props.currentBreaksInfo.palette,
                    colors: newColors,
                  },
                });
              }}
              onPaste={(e) => {
                // We want users to be able to paste a list of colors separated
                // by spaces or by dashes
                const pastedData = e.clipboardData && e.clipboardData.getData('text');
                if (
                  !pastedData
                  || (!pastedData.includes('-') && !pastedData.includes(' '))
                ) {
                  // The user is not pasting colors, maybe a single color
                  // so we return and the default behavior will be applied
                  return;
                }
                e.preventDefault();
                const splitChar = pastedData.includes('-') ? '-' : ' ';
                const colors = pastedData.split(splitChar).map((d) => d.trim());
                if (!colors.every((d) => /^#[0-9a-f]{6}$/i.test(d))) {
                  // Display an error to the user, we need only colors
                  toast.error(LL().ClassificationPanel.pastedColorsInvalid());
                  return;
                }
                if (colors.length !== props.currentBreaksInfo.palette.colors.length) {
                  // Display an error to the user, we need the same number of colors
                  toast.error(LL().ClassificationPanel.pastedColorsWrongLength());
                  return;
                }
                // Update the colors
                props.setCurrentBreaksInfo({
                  ...props.currentBreaksInfo,
                  palette: {
                    ...props.currentBreaksInfo.palette,
                    colors,
                  },
                });
              }}
            />
          </>
        }
      </For>
    </div>
  </div>;
}

// Component to display current breaks
// based on currentBreaksInfo
function DisplayBreaks(
  props: {
    breaks: number[],
    precision: number,
  },
): JSX.Element {
  const { LL } = useI18nContext();
  return <div class="mb-2">
    <p>
      {
        props.breaks
          .map((d) => round(d, props.precision))
          .join(' - ')
      }
      <AiOutlineCopy
        size={18}
        title={LL().ClassificationPanel.copyBreaks()}
        class="is-clickable copy-breaks ml-4"
        onClick={() => {
          // Copy the breaks to the clipboard and display a success message
          navigator.clipboard.writeText(
            props.breaks
              .map((d) => round(d, props.precision))
              .join(' - '),
          );
          toast.success(LL().ClassificationPanel.breaksCopied());
        }}
      />
    </p>
  </div>;
}

// The main component
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
    } else if (classificationMethod() === ClassificationMethod.headTail) {
      breaks = classifier.classify();
      classes = breaks.length - 1;
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
    let customPalette;

    if (typeScheme() === 'sequential') {
      customPalette = {
        id: `${palName}-${classes}`,
        name: palName,
        number: classes,
        type: typeScheme() as PaletteType,
        provenance: 'dicopal',
        reversed: isPaletteReversed(),
      } as CustomPalette;
      customPalette.colors = getSequentialColors(palName as string, classes, isPaletteReversed());
    } else if (typeScheme() === 'diverging') {
      customPalette = {
        id: `${palName}-${classes}-${centralClass()}`,
        name: palName,
        number: classes,
        type: typeScheme() as PaletteType,
        provenance: 'dicopal',
        reversed: isPaletteReversed(),
      } as CustomPalette;
      const positionCentralClass = centralClass()!;
      customPalette.divergingOptions = {
        left: positionCentralClass,
        right: classes - Number(hasNeutralCentralClass()) - positionCentralClass,
        centralClass: hasNeutralCentralClass(),
        balanced: true,
      };
      customPalette.colors = getAsymmetricDivergingColors(
        palName as string,
        customPalette.divergingOptions.left,
        customPalette.divergingOptions.right,
        customPalette.divergingOptions.centralClass,
        customPalette.divergingOptions.balanced,
        isPaletteReversed(),
      );
    } else if (typeScheme() === 'custom') {
      const currentColors = currentBreaksInfo().palette.colors;
      const newColors = interpolateColors(currentColors, classes);
      const cPalName = newColors.join('-');
      customPalette = {
        id: `${cPalName}-${classes}`,
        name: cPalName,
        number: classes,
        type: 'custom',
        provenance: 'user',
        reversed: false,
      } as CustomPalette;
      customPalette.colors = newColors;
    } else {
      throw new Error('Palette type not found !');
    }

    const cp = {
      variable: parameters!.variable,
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

  const parameters = classificationPanelStore.classificationParameters as ClassificationParameters;

  // The values that we are gonna use for the classification
  const filteredSeries = classificationPanelStore.series!
    .filter((d) => isFiniteNumber(d))
    .map((d) => +d);

  const allValuesSuperiorToZero = filteredSeries.every((d) => d > 0);

  const missingValues = classificationPanelStore.series!.length - filteredSeries.length;

  // Basic statistical summary displayed to the user
  const statSummary = prepareStatisticalSummary(filteredSeries);

  const availableSequentialPalettes = getPalettes({ type: 'sequential', number: 8 })
    .map((d) => ({
      name: `${d.name} (${d.provider})`,
      value: d.name,
      prefixImage: PaletteThumbnails[`img${d.provider}${d.name}` as never] as string,
    }));

  const availableDivergingPalettes = getPalettes({ type: 'diverging', number: 8 })
    .map((d) => ({
      name: `${d.name} (${d.provider})`,
      value: d.name,
      prefixImage: PaletteThumbnails[`img${d.provider}${d.name}` as never] as string,
    }));

  // Signals for the current component:
  // - the classification method chosen by the user
  const [
    classificationMethod,
    setClassificationMethod,
  ] = createSignal<ClassificationMethod>(
    parameters.method
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
  // - the amplitude chosen by the user for the
  //   current classification method (only if 'standard deviation' is chosen)
  const [
    amplitude,
    setAmplitude,
  ] = createSignal<number>(
    parameters.amplitude || 1,
  );
  // - whether the mean position is chosen by the user for the current classification
  //   method (only if 'standard deviation' is chosen)
  const [
    meanPositionRole,
    setMeanPositionRole,
  ] = createSignal<'center' | 'boundary'>(
    parameters.meanPositionRole || 'center',
  );
  // - the type of color scheme chosen by the user (sequential or diverging)
  const [
    typeScheme,
    setTypeScheme,
  ] = createSignal<'sequential' | 'diverging' | 'custom'>(
    parameters.palette.type as 'sequential' | 'diverging' | 'custom'
    || 'sequential',
  );
  // - the color palette chosen by the user for the current classification method
  const [
    paletteName,
    setPaletteName,
  ] = createSignal<string | null>(
    parameters.palette.name
    || 'Algae',
  );
  // - the color chosen by the user for the no data values
  const [
    noDataColor,
    setNoDataColor,
  ] = createSignal<string>(
    parameters.noDataColor,
  );
  // - whether to reverse the color palette
  const [
    isPaletteReversed,
    setIsPaletteReversed,
  ] = createSignal<boolean>(
    parameters.palette.reversed,
  );
  // - the inflection point chosen by the user for the
  //   current classification method (only if 'diverging' is chosen)
  const [
    centralClass,
    setCentralClass,
  ] = createSignal<number>(
    parameters.palette.divergingOptions?.left
    || 1,
  );
  // - whether there is a neutral central class for the diverging palette
  const [
    hasNeutralCentralClass,
    setHasNeutralCentralClass,
  ] = createSignal<boolean>(
    parameters.palette.divergingOptions?.centralClass
    || false,
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
  ] = createSignal<ClassificationParameters>(unproxify(parameters));
  // - display option for the classification plot
  const [
    classificationPlotOption,
    setClassificationPlotOption,
  ] = createSignal<{ median: boolean, mean: boolean, sd: boolean, rug: boolean }>({
    median: false,
    mean: false,
    sd: false,
    rug: false,
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
    {
      name: LL().ClassificationPanel.classificationMethods.standardDeviation(),
      value: ClassificationMethod.standardDeviation,
      options: [OptionsClassification.amplitude, OptionsClassification.meanPosition],
    },
    allValuesSuperiorToZero ? {
      name: LL().ClassificationPanel.classificationMethods.geometricProgression(),
      value: ClassificationMethod.geometricProgression,
      options: [OptionsClassification.numberOfClasses],
    } : null,
    {
      name: LL().ClassificationPanel.classificationMethods.nestedMeans(),
      value: ClassificationMethod.nestedMeans,
      options: [OptionsClassification.constrainedNumberOfClasses],
    },
    {
      name: LL().ClassificationPanel.classificationMethods.headTail(),
      value: ClassificationMethod.headTail,
      options: [],
    },
    {
      name: LL().ClassificationPanel.classificationMethods.manual(),
      value: ClassificationMethod.manual,
      options: [OptionsClassification.breaks, OptionsClassification.numberOfClasses],
    },
  ].filter((d) => d !== null);

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
          - {classificationPanelStore.layerName}&nbsp;
          - {parameters.variable}
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
                  const oldClassificationMethod = classificationMethod();
                  setClassificationMethod(value as ClassificationMethod);
                  // If the classification method is nestedMeans, we need to force
                  // the number of classes to be a power of 2.
                  if (value === ClassificationMethod.nestedMeans) {
                    setNumberOfClasses(2 ** Math.round(Math.log2(numberOfClasses())));
                  }
                  // If the previous classification method was nestedMeans and the
                  // number of classes was 16, and the user is not switching to
                  // manual classification, we return to a more reasonable number.
                  if (
                    oldClassificationMethod === ClassificationMethod.nestedMeans
                    && classificationMethod() !== ClassificationMethod.manual
                    && numberOfClasses() === 16
                  ) {
                    setNumberOfClasses(Mmin(d3.thresholdSturges(filteredSeries), 9));
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
                <p class="label is-marginless">{ LL().ClassificationPanel.numberOfClasses() }</p>
                <input
                  class={'input'}
                  type={'number'}
                  value={numberOfClasses()}
                  min={3}
                  max={9}
                  onChange={(event) => {
                    if (event.target.value === '') {
                      // eslint-disable-next-line no-param-reassign
                      event.target.value = `${numberOfClasses()}`;
                      return;
                    }
                    // eslint-disable-next-line no-bitwise
                    let v = +event.target.value | 0;
                    if (v < 2) {
                      // eslint-disable-next-line no-param-reassign
                      event.target.value = '2';
                      v = 2;
                    }
                    // // If the current method is 'nestedMeans', we need to force
                    // // the number of classes to be a power of 2.
                    // if (classificationMethod() === ClassificationMethod.nestedMeans) {
                    //   v = 2 ** Math.round(Math.log2(v));
                    //   // eslint-disable-next-line no-param-reassign
                    //   event.target.value = `${v}`;
                    // }
                    if (classificationMethod() === ClassificationMethod.manual) {
                      setCustomBreaks(
                        Array.from({ length: v })
                          .map((_, i) => (
                            statSummary.minimum + (
                              i * (statSummary.maximum - statSummary.minimum)) / v))
                          .concat([statSummary.maximum]),
                      );
                    }
                    setNumberOfClasses(v);
                    updateClassificationParameters();
                  }}
                />
              </div>
            </Show>
            <Show when={
              classificationMethodHasOption(
                OptionsClassification.constrainedNumberOfClasses,
                classificationMethod(),
                entriesClassificationMethod,
              )
            }>
              <div style={{ position: 'relative', right: '140px' }}>
                <p class="label is-marginless">{LL().ClassificationPanel.numberOfClasses()}</p>
                <InputConstrainedSlider
                  value={numberOfClasses()}
                  allowedValues={[2, 4, 8, 16]}
                  onChange={(v) => {
                    setNumberOfClasses(v);
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
                  <label class="radio m-2" for="mean-position-center">
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
                  <label class="radio m-2" for="mean-position-break">
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
          </div>
          <Show when={
            !classificationMethodHasOption(
              OptionsClassification.breaks,
              classificationMethod(),
              entriesClassificationMethod,
            )
          }>
            <DisplayBreaks
              breaks={currentBreaksInfo().breaks}
              precision={statSummary.precision}
            />
          </Show>
          <Show when={
            classificationMethodHasOption(
              OptionsClassification.breaks,
              classificationMethod(),
              entriesClassificationMethod,
            )
          }>
            <ManualBreaks
              currentBreaksInfo={currentBreaksInfo()}
              setCurrentBreaksInfo={(v) => {
                setCurrentBreaksInfo(v);
                setNumberOfClasses(v.classes);
                setCustomBreaks(v.breaks);
                updateClassificationParameters();
              }}
              statSummary={statSummary}
            />
          </Show>
          <div>
            <div class="is-flex">
              <div style={{ width: '60%' }}>
                <div>
                  {
                    makeClassificationPlot(
                      currentBreaksInfo(),
                      filteredSeries,
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
                        checked={classificationPlotOption().rug}
                        onChange={(e) => {
                          setClassificationPlotOption({
                            ...classificationPlotOption(),
                            rug: e.target.checked,
                          });
                        }}
                      />
                      {LL().ClassificationPanel.displayPopulation()}
                    </label>
                  </div>
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
                          setCentralClass(Mround((numberOfClasses() - 1) / 2));
                          setTypeScheme('diverging');
                          updateClassificationParameters();
                        }}
                        checked={typeScheme() === 'diverging'}
                      />
                      {LL().ClassificationPanel.diverging()}
                    </label>
                    <label class="radio" for="type-scheme-custom">
                      <input
                        type={'radio'}
                        name={'type-scheme'}
                        id={'type-scheme-custom'}
                        onChange={() => {
                          setPaletteName(null);
                          setTypeScheme('custom');
                          updateClassificationParameters();
                        }}
                        checked={typeScheme() === 'custom'}
                      />
                      {LL().ClassificationPanel.customPalette()}
                    </label>
                  </div>
                </div>
                <br/>
                <div class="is-flex is-justify-content-space-between">
                  <div style={{ width: '100%' }}>
                    <p class="label is-marginless">
                      {LL().ClassificationPanel.palette()}
                      <AiOutlineCopy
                        size={16}
                        title={LL().ClassificationPanel.copyPalette()}
                        class="is-clickable copy-palette ml-2"
                        style={{ 'vertical-align': 'text-bottom' }}
                        onClick={() => {
                          // Copy the palette to the clipboard and display a success message
                          navigator.clipboard.writeText(
                            currentBreaksInfo().palette.colors.join(' - '),
                          );
                          toast.success(LL().ClassificationPanel.paletteCopied());
                        }}
                      />
                    </p>
                    <Switch>
                      <Match when={typeScheme() === 'sequential'}>
                        <DropdownMenu
                          id={'dropdown-palette-name'}
                          style={{ width: '240px' }}
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
                          style={{ width: '240px' }}
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
                      <Match when={typeScheme() === 'custom'}>
                        <CustomPaletteCreation
                          currentBreaksInfo={currentBreaksInfo()}
                          setCurrentBreaksInfo={setCurrentBreaksInfo}
                        />
                      </Match>
                    </Switch>
                  </div>
                  <Show when={typeScheme() !== 'custom'}>
                    <div
                      class="control is-flex is-align-items-center mt-4"
                      style={{ width: '50%' }}
                    >
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
                  </Show>
                </div>
                <Show when={missingValues > 0}>
                  <br/>
                  <div class="control is-flex is-align-content-center is-flex-wrap-wrap-reverse">
                    <input
                      class="input mr-5"
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
                    value={centralClass()}
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
