// Imports from solid-js
import {
  createSignal, JSX, For,
  Match, onCleanup, onMount,
  Show, Switch, createMemo,
} from 'solid-js';

// Imports from other libraries
import * as Plot from '@observablehq/plot';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import {
  bivariateClass, classificationMethodHasOption,
  getClassifier,
  makeClassificationMenuEntries, OptionsClassification,
  prepareStatisticalSummary,
} from '../../helpers/classification';
import { isFiniteNumber, unproxify } from '../../helpers/common';
import {
  availableBivariatePalettes,
  bivariatePalettes,
  generateBivariateColors,
} from '../../helpers/color';
import { Mmin, round } from '../../helpers/math';

// Stores
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';
import { classificationMultivariatePanelStore, setClassificationMultivariatePanelStore } from '../../store/ClassificationMultivariatePanelStore';

// Subcomponents
import { ManualBreaks } from '../ClassificationHelpers.tsx';
import DropdownMenu from '../DropdownMenu.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import PlotFigure from '../PlotFigure.tsx';

// Styles
import '../../styles/ClassificationPanel.css';

// Types, interfaces and enums
import {
  type BivariateChoroplethParameters,
  type BivariateVariableDescription,
  ClassificationMethod,
  type CustomPalette,
} from '../../global.d';

const paletteMenuEntries = [
  ...availableBivariatePalettes,
  {
    name: 'Custom...',
    value: 'Custom',
  },
];

// Function that allows to pick a base color and
// two "end" colors for the bivariate palette
function ColorPicker(
  props: {
    colors: [string, string, string],
    onChange: (colors: [string, string, string]) => void,
  },
): JSX.Element {
  const [baseColor, setBaseColor] = createSignal<string>(props.colors[0]);
  const [endColorVar1, setEndColorVar1] = createSignal<string>(props.colors[1]);
  const [endColorVar2, setEndColorVar2] = createSignal<string>(props.colors[2]);
  return <div class="is-flex is-align-items-center is-justify-content-center is-flex-wrap-wrap" style={{ gap: '12px' }}>
    <div class="is-flex is-flex-direction-column is-align-items-center">
      <label for="base-color-picker"> Base color </label>
      <input
        id="base-color-picker"
        type="color"
        value={baseColor()}
        onInput={(e) => {
          setBaseColor(e.currentTarget.value);
          props.onChange([baseColor(), endColorVar1(), endColorVar2()]);
        }}
      />
    </div>
    <div class="is-flex is-flex-direction-column is-align-items-center">
      <label for="end-color-var1-picker"> Variable 1 end color </label>
      <input
        id="end-color-var1-picker"
        type="color"
        value={endColorVar1()}
        onInput={(e) => {
          setEndColorVar1(e.currentTarget.value);
          props.onChange([baseColor(), endColorVar1(), endColorVar2()]);
        }}
      />
    </div>
    <div class="is-flex is-flex-direction-column is-align-items-center">
      <label for="end-color-var2-picker"> Variable 2 end color </label>
      <input
        id="end-color-var2-picker"
        type="color"
        value={endColorVar2()}
        onInput={(e) => {
          setEndColorVar2(e.currentTarget.value);
          props.onChange([baseColor(), endColorVar1(), endColorVar2()]);
        }}
      />
    </div>
  </div>;
}

function BivariateLegendPreview(props: {
  colorScheme: CustomPalette,
}): JSX.Element {
  const numClassesPerVar = Math.sqrt(props.colorScheme.colors.length);
  const cellSize = 20;
  const range = Array.from({ length: numClassesPerVar }, (_, i) => i);

  return <svg
    width={cellSize * numClassesPerVar}
    height={cellSize * numClassesPerVar}
    style={{ border: '1px solid #000' }}
  >
    <For each={range}>
      {
        (i) => (
          <For each={range}>
            {
              (j) => <rect
                  x={j * cellSize}
                  y={(numClassesPerVar - 1 - i) * cellSize}
                  width={cellSize}
                  height={cellSize}
                  fill={props.colorScheme.colors[i * numClassesPerVar + j]}
                />
            }
          </For>
        )
      }
    </For>
  </svg>;
}

export default function ClassificationBivariatePanel(): JSX.Element {
  // Function to recompute the classification given the current options.
  // We scope it here to facilitate the use of the signals that are defined below...
  const updateClassificationParameters = () => {
    /* eslint-disable @typescript-eslint/no-use-before-define */
    classifierVar1 = new (
      getClassifier(classificationMethodVar1())
    )(filteredSeriesVar1, null, applicationSettingsStore.intervalClosure);
    let breaks1;
    if (classificationMethodVar1() === ClassificationMethod.manual) {
      breaks1 = classifierVar1.classify(customBreaksVar1());
    } else {
      breaks1 = classifierVar1.classify(parameters.variable1.classes);
    }
    const entitiesByClassVar1 = classifierVar1.countByClass(breaks1);

    classifierVar2 = new (
      getClassifier(classificationMethodVar2())
    )(filteredSeriesVar2, null, applicationSettingsStore.intervalClosure);
    let breaks2;

    if (classificationMethodVar2() === ClassificationMethod.manual) {
      breaks2 = classifierVar2.classify(customBreaksVar2());
    } else {
      breaks2 = classifierVar2.classify(parameters.variable2.classes);
    }
    const entitiesByClassVar2 = classifierVar2.countByClass(breaks2);

    let palette: CustomPalette;
    console.log(bivariatePalettes, colorScheme());
    if (
      bivariatePalettes
        .map((d) => d.id)
        .includes(colorScheme())
    ) {
      palette = bivariatePalettes.find((d) => d.id === colorScheme())!;
    } else {
      const newColors = generateBivariateColors(
        customBaseColors()[1],
        customBaseColors()[2],
        customBaseColors()[0],
        3,
        'rgb',
        'multiply',
      );
      palette = {
        id: `custom-bivariate-${customBaseColors()[0]}-${customBaseColors()[1]}-${customBaseColors()[2]}`,
        name: 'Custom bivariate palette',
        type: 'custom',
        colors: newColors,
        provenance: 'user',
        reversed: false,
        number: 9,
      };
    }

    const newParameters: BivariateChoroplethParameters = {
      variable1: {
        variable: parameters.variable1.variable,
        method: classificationMethodVar1(),
        breaks: breaks1,
        entitiesByClass: entitiesByClassVar1,
        classes: 3,
      },
      variable2: {
        variable: parameters.variable2.variable,
        method: classificationMethodVar2(),
        breaks: breaks2,
        entitiesByClass: entitiesByClassVar2,
        classes: 3,
      },
      palette,
      noDataColor: noDataColor(),
    };
    setCurrentClassifInfo(newParameters);
    setCustomBreaksVar1(breaks1);
    setCustomBreaksVar2(breaks2);
    setCustomBaseColors([
      palette.colors[0],
      palette.colors[2],
      palette.colors[6],
    ]);
    console.log('Updated bivariate classification parameters:', newParameters);
  }; /* eslint-enable @typescript-eslint/no-use-before-define */

  const { LL } = useI18nContext();

  const parameters = classificationMultivariatePanelStore
    .classificationParameters as BivariateChoroplethParameters;

  const filteredSeriesVar1 = classificationMultivariatePanelStore.series![0]
    .filter((d) => isFiniteNumber(d))
    .map((d) => +d);

  const filteredSeriesVar2 = classificationMultivariatePanelStore.series![1]
    .filter((d) => isFiniteNumber(d))
    .map((d) => +d);

  const ds = classificationMultivariatePanelStore.series![0].map((d, i) => ({
    [parameters.variable1.variable]: isFiniteNumber(d)
      ? d
      : undefined,
    [parameters.variable2.variable]: isFiniteNumber(
      classificationMultivariatePanelStore.series![1][i],
    )
      ? classificationMultivariatePanelStore.series![1][i]
      : undefined,
  }));

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
  // - the breaks chosen by the user for the
  //   current classification method for each variable
  //   (only if 'manual' is chosen)
  const [
    customBreaksVar1,
    setCustomBreaksVar1,
  ] = createSignal<number[]>(parameters.variable1.breaks);
  const [
    customBreaksVar2,
    setCustomBreaksVar2,
  ] = createSignal<number[]>(parameters.variable2.breaks);
  // - the color scheme
  const [
    colorScheme,
    setColorScheme,
  ] = createSignal<string>(
    parameters.palette.id,
  );
  // Base color, end color for var1 and end color for var2
  const [
    customBaseColors,
    setCustomBaseColors,
  ] = createSignal<[string, string, string]>([
    parameters.palette.colors[0],
    parameters.palette.colors[2],
    parameters.palette.colors[6],
  ]);
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

  let classifierVar1 = new (getClassifier(ClassificationMethod.manual))(
    null,
    null,
    applicationSettingsStore.intervalClosure,
    parameters.variable1.breaks,
  );

  let classifierVar2 = new (getClassifier(ClassificationMethod.manual))(
    null,
    null,
    applicationSettingsStore.intervalClosure,
    parameters.variable2.breaks,
  );

  const bivariateClasses = (d: Record<string, any>) => {
    const classVar1 = classifierVar1.getClass(d[parameters.variable1.variable]);
    const classVar2 = classifierVar2.getClass(d[parameters.variable2.variable]);
    return [classVar1, classVar2];
  };

  const bc = (d: Record<string, any>) => bivariateClass(
    d[parameters.variable1.variable],
    d[parameters.variable2.variable],
    classifierVar1,
    classifierVar2,
  );

  const entriesClassificationMethodVar1 = makeClassificationMenuEntries(
    LL,
    statSummaryVar1.unique,
    allValuesSuperiorToZeroVar1,
    3,
  );

  const entriesClassificationMethodVar2 = makeClassificationMenuEntries(
    LL,
    statSummaryVar2.unique,
    allValuesSuperiorToZeroVar2,
    3,
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
    <div class="modal-card" style={{ height: '85vh', width: '90vw' }}>
      <header class="modal-card-head">
        <p class="modal-card-title">
          { LL().ClassificationPanel.title() }&nbsp;
          - {classificationMultivariatePanelStore.layerName}&nbsp;
          - {parameters.variable1.variable} &amp; {parameters.variable2.variable}
        </p>
      </header>
      <section class="modal-card-body">
        <div class="is-flex">
          <div style={{ width: '45%', 'text-align': 'center' }}>
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
            <h3> { LL().ClassificationPanel.classification() } </h3>
            <div class="is-flex" style={{ 'justify-content': 'space-around' }}>
              <div>
                <InputFieldSelect
                  label={'Variable 1'}
                  layout={'vertical'}
                  onChange={(value) => {
                    console.log('Changed var1 classification method to:', value);
                    setClassificationMethodVar1(value as ClassificationMethod);
                    updateClassificationParameters();
                  }}
                  value={classificationMethodVar1()}
                >
                  <For each={entriesClassificationMethodVar1}>
                    {
                      (entry) => <option value={entry.value}>
                        { entry.name }
                      </option>
                    }
                  </For>
                </InputFieldSelect>
                <Show when={
                  classificationMethodHasOption(
                    OptionsClassification.breaks,
                    classificationMethodVar1(),
                    entriesClassificationMethodVar1,
                  )
                }>
                  <ManualBreaks
                    currentBreaksInfo={currentClassifInfo().variable1}
                    setCurrentBreaksInfo={(v) => {
                      const classifInfo = currentClassifInfo();
                      classifInfo.variable1 = v as BivariateVariableDescription;
                      setCurrentClassifInfo(classifInfo);
                      setCustomBreaksVar1(v.breaks);
                      updateClassificationParameters();
                    }}
                    statSummary={statSummaryVar1}
                    fixedNumberOfClasses={3}
                  />
                </Show>
              </div>
              <div>
                <InputFieldSelect
                  label={'Variable 2'}
                  layout={'vertical'}
                  onChange={(value) => {
                    console.log('Changed var2 classification method to:', value);
                    setClassificationMethodVar2(value as ClassificationMethod);
                    updateClassificationParameters();
                  }}
                  value={classificationMethodVar2()}
                >
                  <For each={entriesClassificationMethodVar2}>
                    {
                      (entry) => <option value={entry.value}>
                        { entry.name }
                      </option>
                    }
                  </For>
                </InputFieldSelect>
                <Show when={
                  classificationMethodHasOption(
                    OptionsClassification.breaks,
                    classificationMethodVar2(),
                    entriesClassificationMethodVar2,
                  )
                }>
                  <ManualBreaks
                    currentBreaksInfo={currentClassifInfo().variable2}
                    setCurrentBreaksInfo={(v) => {
                      const classifInfo = currentClassifInfo();
                      classifInfo.variable2 = v as BivariateVariableDescription;
                      setCustomBreaksVar2(v.breaks);
                      updateClassificationParameters();
                    }}
                    statSummary={statSummaryVar2}
                    fixedNumberOfClasses={3}
                  />
                </Show>
              </div>
            </div>
            <h3> { 'Couleur' } </h3>
            <div>
              <DropdownMenu
                id={'dropdown-bivariate-palette'}
                style={{ width: '220px', 'margin-bottom': '18px' }}
                entries={paletteMenuEntries}
                defaultEntry={
                  paletteMenuEntries
                    .find((d) => d.value === colorScheme())
                  || paletteMenuEntries[paletteMenuEntries.length - 1]
                }
                onChange={(value) => {
                  setColorScheme(value);
                  updateClassificationParameters();
                }}
              />
              <br />
              <div style={{ width: '100%', 'text-align': 'center' }}>
                <BivariateLegendPreview colorScheme={currentClassifInfo().palette} />
                <Show when={colorScheme() === 'Custom'}>
                  <ColorPicker
                    colors={[
                      currentClassifInfo().palette.colors[0],
                      currentClassifInfo().palette.colors[2],
                      currentClassifInfo().palette.colors[6],
                    ]}
                    onChange={(colors) => {
                      setCustomBaseColors(colors);
                      updateClassificationParameters();
                    }}
                  />
                  <br />
                </Show>
              </div>
            </div>
          </div>
        </div>
        <hr />
        <div style={{ 'text-align': 'center' }}>
          <h3> { LL().ClassificationPanel.distribution() } </h3>
          <div>
            <PlotFigure
              id={'scatter-plot-bivariate-distribution'}
              options={{
                style: {
                  background: 'white',
                  color: 'black',
                  height: '33vh',
                },
                // height: 400,
                x: {
                  label: currentClassifInfo().variable2.variable,
                },
                y: {
                  label: currentClassifInfo().variable1.variable,
                },
                marks: [
                  Plot.dot(ds, {
                    y: currentClassifInfo().variable1.variable,
                    x: currentClassifInfo().variable2.variable,
                    // fill: 'red',
                    fill: (d) => currentClassifInfo().palette.colors[bc(d)],
                    r: 1.4,
                  }),
                  Plot.text(
                    ds,
                    Plot.groupZ(
                      { text: 'count', x: 'mean', y: 'mean' },
                      {
                        fontSize: 14,
                        stroke: 'width',
                        strokeWidth: 8,
                        fill: 'black',
                        y: currentClassifInfo().variable1.variable,
                        x: currentClassifInfo().variable2.variable,
                        z: (d) => bivariateClasses(d).toString(),
                      },
                    ),
                  ),
                  Plot.ruleX([classifierVar2.breaks[0]], { }),
                  Plot.ruleY([classifierVar1.breaks[0]], { }),
                  classifierVar2.breaks.slice(1, -1).map((vx: number) => [
                    Plot.ruleX([vx], { strokeDasharray: 4, strokeOpacity: 0.4 }),
                  ]),
                  classifierVar1.breaks.slice(1, -1).map((vy: number) => [
                    Plot.ruleY([vy], { strokeDasharray: 4, strokeOpacity: 0.4 }),
                  ]),
                ],
              }}
            />
          </div>
          <div
            style={{ width: '50%', 'text-align': 'center' }}
            class="is-flex is-flex-direction-column"
          >
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
