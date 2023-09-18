import {
  createSignal,
  For, JSX, onMount,
} from 'solid-js';
import * as Plot from '@observablehq/plot';

import { useI18nContext } from '../../i18n/i18n-solid';
import d3 from '../../helpers/d3-custom';
import {
  classificationPanelStore,
  setClassificationPanelStore,
} from '../../store/ClassificationPanelStore';

import '../../styles/ClassificationPanel.css';

enum DistributionPlotType {
  box,
  histogram,
  dotHistogram,
  beeswarm,
  violin,
}

function kde(
  kernel: (x: number) => number,
  thresholds: number[],
  data: number[],
): [number, number][] {
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

function makeDistributionPlot(type: DistributionPlotType = DistributionPlotType.beeswarm) {
  if (type === DistributionPlotType.box) {
    return Plot.plot({
      height: 300,
      width: 400,
      x: { nice: true },
      marks: [
        Plot.boxX(classificationPanelStore.series),
      ],
    });
  }
  if (type === DistributionPlotType.dotHistogram) {
    return Plot.plot({
      height: 300,
      width: 400,
      r: { range: [0, 15] },
      x: { nice: true },
      marks: [
        Plot.dot(
          classificationPanelStore.series,
          Plot.binX({ r: 'count' }, { x: (d) => d }),
        ),
      ],
    });
  }
  if (type === DistributionPlotType.histogram) {
    return Plot.plot({
      height: 300,
      width: 400,
      x: { nice: true },
      y: { nice: true },
      marks: [
        Plot.rectY(
          classificationPanelStore.series,
          Plot.binX({ y: 'proportion' }, { x: (d) => d, thresholds: 'scott' }),
        ),
        Plot.ruleY([0]),
      ],
    });
  }
  if (type === DistributionPlotType.beeswarm) {
    return Plot.plot({
      height: 300,
      width: 400,
      x: { nice: true },
      marks: [
        Plot.dot(
          classificationPanelStore.series,
          Plot.dodgeY('middle', { x: (d) => d }),
        ),
      ],
    });
  }
  if (type === DistributionPlotType.violin) {
    const thresholds = d3.ticks(...d3.nice(...d3.extent(classificationPanelStore.series), 10), 40);
    const density = kde(epanechnikov(10), thresholds, classificationPanelStore.series);
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

export default function ClassificationPanel(): JSX.Element {
  const { LL } = useI18nContext();
  const [
    distributionPlot,
    setDistributionPlot,
  ] = createSignal<DistributionPlotType>(DistributionPlotType.box);
  let refParentNode: HTMLDivElement;

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
        {
          makeDistributionPlot(DistributionPlotType.violin)
        }
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
