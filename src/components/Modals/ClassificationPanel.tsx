import {
  createSignal,
  JSX,
  onMount,
  Show,
} from 'solid-js';
import * as Plot from '@observablehq/plot';

import { useI18nContext } from '../../i18n/i18n-solid';
import d3 from '../../helpers/d3-custom';
import {
  classificationPanelStore,
  setClassificationPanelStore,
} from '../../store/ClassificationPanelStore';

import '../../styles/ClassificationPanel.css';
import DropdownMenu from '../DropdownMenu.tsx';
import { getClassifier } from '../../helpers/classification';
import { isNumber } from '../../helpers/common';
import { round } from '../../helpers/math';
import { ClassificationMethod } from '../../global.d';

enum DistributionPlotType {
  box,
  histogram,
  dotHistogram,
  beeswarm,
  violin,
}

enum OptionsClassification {
  numberOfClasses,
  amplitude,
  meanPosition,
  breaks,
}

function kde(
  kernel: (x: number) => number,
  thresholds: number[],
  data: number[],
): [number, number | undefined][] {
  return thresholds
    .map((t) => [t, d3.mean(data, (d) => kernel(t - d))]);
}

function epanechnikov(bandwidth: number) {
  return (x: number): number => {
    const xb = x / bandwidth;
    return Math.abs(xb) <= 1
      ? (0.75 * (1 - x * x)) / bandwidth
      : 0;
  };
}

function getRadiusBeeswarm(series: number[]) {
  if (series.length < 100) {
    return 3;
  }
  if (series.length < 1000) {
    return 2;
  }
  return 1;
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
      y: { nice: true },
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
  if (type === DistributionPlotType.beeswarm) {
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
            r: getRadiusBeeswarm(series),
          }),
        ),
      ],
    });
  }
  if (type === DistributionPlotType.violin) {
    const thresholds = d3.ticks(...d3.nice(...d3.extent(series), 10), 40);
    const density = kde(epanechnikov(0.4), thresholds, classificationPanelStore.series);
    return Plot.plot({
      height: 300,
      width: 400,
      x: { axis: null },
      // y: { reverse: true },
      marks: [
        Plot.areaX(density, {
          curve: 'natural',
          x1: (d) => d[1],
          x2: (d) => -d[1],
          y: (d) => d[0],
          fill: '#eee',
        }),
        Plot.lineX(density, {
          curve: 'natural',
          x: (d) => d[1],
          y: (d) => d[0],
        }),
        Plot.lineX(density, {
          curve: 'natural',
          x: (d) => -d[1],
          y: (d) => d[0],
        }),
      ],
    });
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

function prepareStatisticalSummary(series: number[]) {
  return {
    population: series.length,
    minimum: d3.min(series),
    maximum: d3.max(series),
    mean: d3.mean(series),
    median: d3.median(series),
    standardDeviation: d3.deviation(series),
    // variance: d3.variance(series),
    // varianceCoefficient: d3.deviation(series) / d3.mean(series),
  };
}

export default function ClassificationPanel(): JSX.Element {
  // Function to recompute the classification given the current options.
  // We scope it here to facilitate the use of the signals that are defined below...
  const computeClassification = (series: number[], method: ClassificationMethod, options: any) => {
    const classifier = new (getClassifier(method))(series);
    const breaks = classifier.classify(options.nbClasses);
    const entitiesByClass = classifier.countByClass();
    setCurrentBreaks(breaks); // eslint-disable-line @typescript-eslint/no-use-before-define
    return breaks;
  };

  const { LL } = useI18nContext();

  // The values that we are gonna use for the classification
  const filteredSeries = classificationPanelStore.series
    .filter((d) => isNumber(d))
    .map((d) => +d);

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
  ] = createSignal<ClassificationMethod>(ClassificationMethod.quantile);
  // - the number of classes chosen by the user for the current classification method
  const [
    numberOfClasses,
    setNumberOfClasses,
  ] = createSignal<number>(6);
  // - the breaks chosen by the user for the
  //   current classification method (only if 'manual' is chosen)
  const [
    customBreaks,
    setCustomBreaks,
  ] = createSignal<number[]>([]);
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
  // - the current breaks (given the last option that changed, or the default breaks)
  const [
    currentBreaks,
    setCurrentBreaks,
  ] = createSignal<number[]>(
    (new (getClassifier(classificationMethod()))(filteredSeries)).classify(numberOfClasses()),
  );
  console.log(currentBreaks());

  let refParentNode: HTMLDivElement;

  const entriesDistributionPlot = [
    { name: LL().ClassificationPanel.histogram(), value: DistributionPlotType.histogram },
    { name: LL().ClassificationPanel.box(), value: DistributionPlotType.box },
    { name: LL().ClassificationPanel.dotHistogram(), value: DistributionPlotType.dotHistogram },
    { name: LL().ClassificationPanel.beeswarm(), value: DistributionPlotType.beeswarm },
  ];

  const entriesClassificationMethod = [
    {
      name: LL().ClassificationPanel.classificationMethods.quantile(),
      value: ClassificationMethod.quantile,
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

  console.log(filteredSeries, statSummary);

  onMount(() => {
    // We could set focus on the confirm button when the modal is shown
    // as in some other modal, although it is not as important here...
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
          <div class={'is-flex'}>
            <div style={{ width: '50%' }}>
              <DropdownMenu
                id={'classification-method'}
                entries={entriesClassificationMethod}
                defaultEntry={entriesClassificationMethod[0]}
                onChange={(value) => {
                  setClassificationMethod(value);
                  computeClassification(
                    filteredSeries,
                    classificationMethod(),
                    { nbClasses: numberOfClasses() },
                  );
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
                    setNumberOfClasses(event.target.value);
                    computeClassification(
                      filteredSeries,
                      classificationMethod(),
                      { nbClasses: numberOfClasses() },
                    );
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
                <input class={'input'} type={'number'} value={1} min={0.1} max={10} step={0.1}/>
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
                    <input type={'radio'} name={'mean-position'} id={'mean-position-center'} checked />
                    { LL().ClassificationPanel.meanPositionCenter() }
                  </label>
                  <label class="radio" for="mean-position-break">
                    <input type={'radio'} name={'mean-position'} id={'mean-position-break'}>Borne de classe</input>
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
                <p class="label">{ LL().ClassificationPanel.breaks() }</p>
                <textarea class={'textarea'} />
              </Show>
            </div>
          </div>
          <div>
            <p>{ currentBreaks().join(' - ')}</p>
          </div>
        </div>

      </section>
      <footer class="modal-card-foot">
        <button
          class="button is-success"
          onClick={ () => { setClassificationPanelStore({ show: false }); } }
        >{ LL().SuccessButton() }</button>
        <button
          class="button"
          onClick={ () => { setClassificationPanelStore({ show: false }); } }
        >{ LL().CancelButton() }</button>
      </footer>
    </div>
  </div>;
}
