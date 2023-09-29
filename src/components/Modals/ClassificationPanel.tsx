import {
  createSignal, JSX, onCleanup, onMount, Show,
} from 'solid-js';
import * as Plot from '@observablehq/plot';
import { getPalette } from 'dicopal';

import { useI18nContext } from '../../i18n/i18n-solid';
import d3 from '../../helpers/d3-custom';
import { classificationPanelStore, setClassificationPanelStore } from '../../store/ClassificationPanelStore';

import '../../styles/ClassificationPanel.css';
import DropdownMenu from '../DropdownMenu.tsx';
import { getClassifier } from '../../helpers/classification';
import { isNumber } from '../../helpers/common';
import {
  epanechnikov,
  extent,
  getBandwidth,
  hasNegative,
  kde,
  round,
} from '../../helpers/math';
import { ClassificationMethod, ClassificationParameters, CustomPalette } from '../../global.d';

enum DistributionPlotType {
  box,
  histogram,
  dotHistogram,
  beeswarm,
  histogramAndDensity,
}

enum OptionsClassification {
  numberOfClasses,
  amplitude,
  meanPosition,
  breaks,
}

function makeBeeswarmPlot(series: number[], logTransform: boolean, sizeRatio = 1) {
  const r = sizeRatio === 1 ? 2.5 : 2.75 * sizeRatio;
  const padding = sizeRatio === 1 ? 1.25 : 0.8 * sizeRatio;
  return Plot.plot({
    height: 300,
    // width: 400,
    marginLeft: 50,
    x: { nice: true, type: logTransform ? 'log' : 'linear' },
    marks: [
      Plot.dot(
        series,
        Plot.dodgeY('middle', {
          x: (d) => d,
          r,
          padding,
          fill: 'black',
        }),
      ),
    ],
  });
}

function makeDistributionPlot(
  series: number[],
  type: DistributionPlotType = DistributionPlotType.beeswarm,
  logTransform = false,
) {
  if (type === DistributionPlotType.box) {
    return Plot.plot({
      height: 300,
      // width: 400,
      marginLeft: 50,
      marginTop: 100,
      marginBottom: 100,
      x: { nice: true, type: logTransform ? 'log' : 'linear' },
      marks: [
        Plot.boxX(series),
      ],
    });
  }
  if (type === DistributionPlotType.dotHistogram) {
    return Plot.plot({
      height: 300,
      // width: 400,
      marginLeft: 50,
      marginTop: 100,
      marginBottom: 100,
      r: { range: [0, 15] },
      x: { nice: true, type: logTransform ? 'log' : 'linear' },
      marks: [
        Plot.dot(
          series,
          Plot.binX({ r: 'count' }, { x: (d) => d }),
        ),
      ],
    });
  }
  if (type === DistributionPlotType.histogram) {
    return Plot.plot({
      height: 300,
      // width: 400,
      marginLeft: 50,
      x: { nice: true, type: logTransform ? 'log' : 'linear' },
      y: { nice: true, label: 'Count' },
      marks: [
        Plot.rectY(
          series,
          Plot.binX(
            { y: 'count' },
            {
              x: (d) => d,
              thresholds: 'scott',
              tip: true,
            },
          ),
        ),
        Plot.ruleY([0]),
      ],
    });
  }
  if (type === DistributionPlotType.histogramAndDensity) {
    const [min, max] = d3.nice(...extent(series), 1);
    // How many bin ?
    const n = d3.thresholdScott(series, min, max);
    // Threshold values for the bins
    const thresholds = d3.ticks(min, max, n);
    // Density values for the bins, using the epanechnikov kernel
    // and the bandwidth computed with bw.nrd0 of R stats package.
    const dens = kde(
      epanechnikov(getBandwidth(series)),
      thresholds,
      series,
    );
    // Sum of the density values
    const sum = d3.sum(dens, (d) => d[1]);
    // Normalize so that integral = 1
    const density = dens.map((d) => [d[0], d[1] / sum]);
    // Todo: we should rename Y axis and add tooltip for the number of individuals
    //       in each rectangle of the histogram.
    return Plot.plot({
      height: 300,
      // width: 400,
      marginLeft: 50,
      x: { nice: true, type: logTransform ? 'log' : 'linear' },
      y: { nice: true },
      marks: [
        Plot.rectY(
          series,
          Plot.binX(
            { y: 'proportion' },
            {
              x: (d) => d,
              thresholds: 'scott',
              tip: true,
            },
          ),
        ),
        Plot.line(density, {
          y: (d) => d[1],
          x: (d) => d[0],
          stroke: 'red',
          curve: 'natural',
        }),
        Plot.ruleY([0]),
      ],
    });
  }
  if (type === DistributionPlotType.beeswarm) {
    // Currently, beeswarm using the dogdeY transform may plot points outside the plot area
    // (i think this is tracked in https://github.com/observablehq/plot/issues/905).
    // So the trick is :
    // - me make a first plot,
    // - we add it to the DOM so we can compute the height of <g> element that contains the dots,
    // - we remove the plot from the DOM,
    // - if the height of the <g> element is greater than 300px, we make a second plot
    //   with a lower radius and padding (so that the dots are smaller),
    //   to do so, we compute a ratio between the height of the <g> element and 300px,
    //   make a second plot and return it,
    // - otherwise we return the first plot.
    let ppp = makeBeeswarmPlot(series, logTransform);
    document.body.append(ppp);
    const th = ppp.querySelector('g[aria-label="dot"]').getBoundingClientRect().height;
    ppp.remove();
    if (th > 300) {
      const ratio = 300 / th;
      ppp = makeBeeswarmPlot(series, logTransform, ratio);
    }
    return ppp;
  }
  return <div />;
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

const makeColorNbIndiv = (
  classifParam: ClassificationParameters,
): { color: string, indiv: number }[] => classifParam.entitiesByClass
  .map((n, i) => ({
    color: classifParam.palette.colors[i],
    indiv: n,
  }));

function prepareStatisticalSummary(series: number[]) {
  const [min, max] = extent(series);

  return {
    population: series.length,
    minimum: min,
    maximum: max,
    mean: d3.mean(series),
    median: d3.median(series),
    standardDeviation: d3.deviation(series),
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

  // Signals for the current component:
  // - the kind of distribution plot that the user wants to see
  const [
    distributionPlot,
    setDistributionPlot,
  ] = createSignal<DistributionPlotType>(DistributionPlotType.histogram);
  // - whether to display the distribution using a logarithmic scale on the X axis
  const [
    logScale,
    setLogScale,
  ] = createSignal<boolean>(false);
  // - the classification method chosen by the user
  const [
    classificationMethod,
    setClassificationMethod,
  ] = createSignal<ClassificationMethod>(ClassificationMethod.quantiles);
  // - the number of classes chosen by the user for the current classification method
  const [
    numberOfClasses,
    setNumberOfClasses,
  ] = createSignal<number>(6);
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
  ] = createSignal<string>('OrRd');
  // - the color chosen by the user for the no data values
  const [
    noDataColor,
    setNoDataColor,
  ] = createSignal<string>('#bebebe');
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

  let refParentNode: HTMLDivElement;

  const entriesDistributionPlot = [
    { name: LL().ClassificationPanel.histogram(), value: DistributionPlotType.histogram },
    { name: LL().ClassificationPanel.box(), value: DistributionPlotType.box },
    { name: LL().ClassificationPanel.dotHistogram(), value: DistributionPlotType.dotHistogram },
    { name: LL().ClassificationPanel.beeswarm(), value: DistributionPlotType.beeswarm },
    { name: 'Histogram and density', value: DistributionPlotType.histogramAndDensity },
  ];

  const entriesClassificationMethod = [
    {
      name: LL().ClassificationPanel.classificationMethods.quantiles(),
      value: ClassificationMethod.quantiles,
      options: [OptionsClassification.numberOfClasses],
    },
    {
      name: LL().ClassificationPanel.classificationMethods.equalInterval(),
      value: ClassificationMethod.equalInterval,
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
            <div> { makeDistributionPlot(filteredSeries, distributionPlot(), logScale()) } </div>
            <div
              style={{
                display: 'flex',
                padding: '1em',
                'justify-content': 'space-evenly',
                'flex-direction': 'row',
                'align-items': 'center',
              }}>
              <DropdownMenu
                id={'distribution-plot-type'}
                entries={entriesDistributionPlot}
                defaultEntry={entriesDistributionPlot[0]}
                onChange={(value) => setDistributionPlot(value)}
                style={{ width: '200px' }}
              />
              <div class={'control'}>
                <label>
                  <input
                    class={'checkbox'}
                    type={'checkbox'}
                    checked={false}
                    onChange={
                    (event) => setLogScale(event.target.checked) }/>
                  { LL().ClassificationPanel.logarithmicScale() }
                </label>
              </div>
            </div>
          </div>
        </div>
        <hr />
        <div style={{ 'text-align': 'center' }}>
          <h3> { LL().ClassificationPanel.classification() } </h3>
          <div class={'is-flex is-flex-direction-column'}>
            <div style={{ width: '50%' }}>
              <DropdownMenu
                id={'classification-method'}
                style={{ width: '220px' }}
                entries={entriesClassificationMethod}
                defaultEntry={entriesClassificationMethod[0]}
                onChange={(value) => {
                  setClassificationMethod(value);
                  updateClassificationParameters();
                }}
              />
              <Show when={
                classificationMethodHasOption(
                  OptionsClassification.numberOfClasses,
                  classificationMethod(),
                  entriesClassificationMethod,
                )
              }>
                <p class="label">{ LL().ClassificationPanel.numberOfClasses() }</p>
                <input
                  class={'input'}
                  type={'number'}
                  value={6}
                  onchange={(event) => {
                    setNumberOfClasses(+event.target.value);
                    updateClassificationParameters();
                  }}
                />
              </Show>
              <Show when={
                classificationMethodHasOption(
                  OptionsClassification.amplitude,
                  classificationMethod(),
                  entriesClassificationMethod,
                )
              }>
                <p class="label">{ LL().ClassificationPanel.amplitude() }</p>
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
              </Show>
              <Show when={
                classificationMethodHasOption(
                  OptionsClassification.meanPosition,
                  classificationMethod(),
                  entriesClassificationMethod,
                )
              }>
                <p class="label">{ LL().ClassificationPanel.meanPosition() }</p>
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
              </Show>
              <Show when={
                classificationMethodHasOption(
                  OptionsClassification.breaks,
                  classificationMethod(),
                  entriesClassificationMethod,
                )
              }>
                { /* <p class="label">{ LL().ClassificationPanel.breaks() }</p> */ }
                <textarea class={'textarea'} value={'yo'}>
                  { currentBreaksInfo().breaks.join(' - ') }
                </textarea>
              </Show>
            </div>
          </div>
          <div>
            <p>{ currentBreaksInfo().breaks.join(' - ')}</p>
            <div>
              {
                Plot.plot({
                  x: { ticks: false },
                  y: { axis: false },
                  height: 75,
                  marks: [
                    Plot.rect(
                      makeColorNbIndiv(currentBreaksInfo()),
                      {
                        fill: 'color',
                        x1: (d, i) => i * 10,
                        x2: (d, i) => i * 10 + 10,
                        y1: 0,
                        y2: 10,
                      },
                    ),
                    Plot.rect(
                      makeColorNbIndiv(currentBreaksInfo()),
                      {
                        fill: 'white',
                        x1: (d, i) => i * 10 + 3,
                        x2: (d, i) => i * 10 + 7,
                        y1: 2.5,
                        y2: 7.5,
                      },
                    ),
                    Plot.text(
                      makeColorNbIndiv(currentBreaksInfo()),
                      {
                        text: 'indiv',
                        x: (d, i) => i * 10 + 5,
                        textAnchor: 'middle',
                        frameAnchor: 'middle',
                        fontSize: 16,
                      },
                    ),
                  ],
                })
              }
            </div>
            <Show when={missingValues > 0}>
              <p class="label">{ LL().ClassificationPanel.missingValues(missingValues) }</p>
              <div class="control">
                <input class="color" type="color" />
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
