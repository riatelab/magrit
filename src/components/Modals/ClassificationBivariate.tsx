// Imports from solid-js
import {
  createSignal, JSX, For,
  Match, onCleanup, onMount,
  Show, Switch, createMemo,
} from 'solid-js';

// Imports from other libraries
import * as Plot from '@observablehq/plot';

// Helpers
import d3 from '../../helpers/d3-custom';
import { useI18nContext } from '../../i18n/i18n-solid';
import {
  bivariateClass,
  getClassifier,
  makeClassificationMenuEntries,
  prepareStatisticalSummary,
} from '../../helpers/classification';
import { isFiniteNumber, unproxify } from '../../helpers/common';
import { availableBivariatePalettes } from '../../helpers/color';
import { Mmin, round } from '../../helpers/math';

// Stores
import { classificationMultivariatePanelStore, setClassificationMultivariatePanelStore } from '../../store/ClassificationMultivariatePanelStore';

// Subcomponents
import DropdownMenu from '../DropdownMenu.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';

// Styles
import '../../styles/ClassificationPanel.css';

// Types, interfaces and enums
import {
  type BivariateChoroplethParameters,
  ClassificationMethod,
  type CustomPalette,
} from '../../global.d';
import PlotFigure from '../PlotFigure.tsx';
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';

const paletteMenuEntries = [
  ...availableBivariatePalettes,
  {
    name: 'Custom...',
    value: 'Custom',
  },
];

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

  const classifierVar1 = createMemo(() => {
    const Cls = getClassifier(ClassificationMethod.manual);
    return new Cls(
      null,
      null,
      applicationSettingsStore.intervalClosure,
      parameters.variable1.breaks,
    );
  });

  const classifierVar2 = createMemo(() => {
    const Cls = getClassifier(ClassificationMethod.manual);
    return new Cls(
      null,
      null,
      applicationSettingsStore.intervalClosure,
      parameters.variable2.breaks,
    );
  });

  const bivariateClasses = (d: Record<string, any>) => {
    const classVar1 = classifierVar1().getClass(d[parameters.variable1.variable]);
    const classVar2 = classifierVar2().getClass(d[parameters.variable2.variable]);
    return [classVar1, classVar2];
  };

  const bc = (d: Record<string, any>) => bivariateClass(
    d[parameters.variable1.variable],
    d[parameters.variable2.variable],
    classifierVar1(),
    classifierVar2(),
  );

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
    <div class="modal-card" style={{ height: '85vh' }}>
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
              <InputFieldSelect
                label={'Variable 1'}
                layout={'vertical'}
                onChange={(value) => {
                  console.log('Changed var1 classification method to:', value);
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
              <InputFieldSelect
                label={'Variable 2'}
                layout={'vertical'}
                onChange={(value) => {
                  console.log('Changed var2 classification method to:', value);
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
            </div>
            <h3> { 'Couleur' } </h3>
            <div>
              <DropdownMenu
                id={'dropdown-bivariate-palette'}
                style={{ width: '220px', 'margin-bottom': '18px' }}
                entries={paletteMenuEntries}
                defaultEntry={
                  paletteMenuEntries
                    .find((d) => d.value === colorScheme().id)!
                }
                onChange={(value) => {
                  setColorScheme(value);
                }}
              />
              <br />
              <div style={{ width: '100%', 'text-align': 'center' }}>
                <BivariateLegendPreview colorScheme={colorScheme()} />
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
                  label: parameters.variable2.variable,
                },
                y: {
                  label: parameters.variable1.variable,
                },
                marks: [
                  Plot.dot(ds, {
                    y: parameters.variable1.variable,
                    x: parameters.variable2.variable,
                    // fill: 'red',
                    fill: (d) => parameters.palette.colors[bc(d)],
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
                        y: parameters.variable1.variable,
                        x: parameters.variable2.variable,
                        z: (d) => bivariateClasses(d).toString(),
                      },
                    ),
                  ),
                  Plot.ruleX([classifierVar2().breaks[0]], { }),
                  Plot.ruleY([classifierVar1().breaks[0]], { }),
                  classifierVar2().breaks.slice(1, -1).map((vx) => [
                    Plot.ruleX([vx], { strokeDasharray: 4, strokeOpacity: 0.4 }),
                  ]),
                  classifierVar1().breaks.slice(1, -1).map((vy) => [
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
