// Imports from solid-js
import {
  createSignal, JSX, For,
  Match, onCleanup, onMount,
  Show, Switch,
} from 'solid-js';

// Imports from other packages
import {
  getAsymmetricDivergingColors,
  getSequentialColors,
  PaletteType,
} from 'dicopal';
import toast from 'solid-toast';
import { AiOutlineCopy } from 'solid-icons/ai';

// Helpers
import { useI18nContext } from '../i18n/i18n-solid';
import d3 from '../helpers/d3-custom';
import {
  classificationMethodHasOption,
  getClassifier,
  makeClassificationMenuEntries,
  OptionsClassification,
  prepareStatisticalSummary,
} from '../helpers/classification';
import {
  isEqual, isFiniteNumber,
  isGreaterThan, isLessThan, unproxify,
} from '../helpers/common';
import { Mmin, Mround, round } from '../helpers/math';

// Styles
import '../styles/ClassificationPanel.css';

// Types, interfaces and enums
import {
  AllowManualBreaks,
  ClassificationMethod,
  type ClassificationParameters,
  type CustomPalette,
} from '../global.d';

// Component to display current breaks based on
// currentBreaksInfo and enable copying breaks to clipboard
export function DisplayBreaks(
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

// Component for choosing breaks manually
export function ManualBreaks(
  props: {
    currentBreaksInfo: AllowManualBreaks,
    setCurrentBreaksInfo: (cp: AllowManualBreaks) => void,
    statSummary: ReturnType<typeof prepareStatisticalSummary>,
    fixedNumberOfClasses?: number,
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
  const displayWarningNumberOfClassesMismatch = () => {
    toast.error(LL().ClassificationPanel.pastedBreaksInvalidNumberOfClasses({
      number: props.fixedNumberOfClasses,
    }));
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
            if (props.fixedNumberOfClasses) {
              if (newBreaks.length - 1 !== props.fixedNumberOfClasses) {
                // Display an error to the user, we need exactly
                // fixedNumberOfClasses classes
                displayWarningNumberOfClassesMismatch();
                return;
              }
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
              // Display a warning to the user, but we still update the breaks
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
