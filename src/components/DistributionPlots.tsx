// Imports from Plot
import * as Plot from '@observablehq/plot';
import type { Plot as PlotType } from '@observablehq/plot';

// Helpers
import { useI18nContext } from '../i18n/i18n-solid';

// D3 and math helpers
import d3 from '../helpers/d3-custom';
import { pickTextColorBasedOnBgColor } from '../helpers/color';
import {
  extent,
  lowerQuartile,
  lowerWhisker,
  max,
  upperQuartile,
  upperWhisker,
} from '../helpers/math';

// Types / Interfaces / Enums
import { type ClassificationParameters } from '../global';

export function makeColoredBucketPlot(
  classifParam: ClassificationParameters,
): ((SVGSVGElement | HTMLElement) & PlotType) {
  const colorNbIndiv = classifParam.entitiesByClass
    .map((n, i) => ({
      color: classifParam.palette.colors[i],
      nb: n,
    }));

  return Plot.plot({
    x: { ticks: false },
    y: { axis: false },
    margin: 10,
    height: 60,
    marks: [
      Plot.rect(
        colorNbIndiv,
        {
          fill: 'color',
          x1: (d, i) => i * 10,
          x2: (d, i) => i * 10 + 10,
          y1: 0,
          y2: 10,
          stroke: 'silver',
        },
      ),
      Plot.text(
        colorNbIndiv,
        {
          text: (d) => d.nb.toLocaleString(),
          x: (d, i) => i * 10 + 5,
          textAnchor: 'middle',
          frameAnchor: 'middle',
          fontSize: 16,
          fill: (d) => pickTextColorBasedOnBgColor(d.color, '#fefefe', '#333333'),
          stroke: (d) => pickTextColorBasedOnBgColor(d.color, '#333333', '#fefefe'),
          strokeWidth: 1.5,
          fontWeight: 'bold',
        },
      ),
    ],
  });
}

export function makeClassificationPlot(
  classifParam: ClassificationParameters,
  statSummary: {
    median: number;
    mean: number;
    maximum: number;
    minimum: number;
    standardDeviation: number;
    population: number
  },
  show: {
    mean: boolean,
    median: boolean,
    sd: boolean,
  },
): ((SVGSVGElement | HTMLElement) & PlotType) {
  const { LL } = useI18nContext();
  const minmax = [
    classifParam.breaks[0],
    classifParam.breaks[classifParam.breaks.length - 1],
  ];
  const breaksData = [];
  for (let i = 0; i < classifParam.breaks.length - 1; i++) { // eslint-disable-line no-plusplus
    breaksData.push({
      x1: classifParam.breaks[i],
      x2: classifParam.breaks[i + 1],
      y: classifParam.entitiesByClass[i] / (classifParam.breaks[i + 1] - classifParam.breaks[i]),
      count: classifParam.entitiesByClass[i],
      color: classifParam.palette.colors[i],
    });
  }

  const maxY = max(breaksData.map((d) => d.y));
  const adjustHeight = (currentVal: number) => {
    if (currentVal * (170 / maxY) < 1.5) {
      return 1.5;
    }
    return currentVal * (170 / maxY);
  };

  return Plot.plot({
    height: 200,
    marginBottom: 20,
    marginTop: 10,
    x: {
      domain: minmax,
      tickFormat: (d) => d.toLocaleString(),
    },
    y: {
      nice: false,
      grid: true,
      ticks: false,
    },
    marks: [
      Plot.rectY(breaksData, {
        x1: (d) => d.x1,
        x2: (d) => d.x2,
        y: (d) => adjustHeight(d.y), //  +  maxY / 170,
        fill: (d) => d.color,
        channels: {
          [LL().ClassificationPanel.count()]: (d) => d.count,
        },
        tip: {
          format: {
            [LL().ClassificationPanel.count()]: true,
            fill: false,
            y: false,
            x: false,
          },
          fill: 'var(--bulma-background)',
        },
      }),
      show.mean
        ? Plot.ruleX([statSummary.mean], { stroke: 'red', strokeWidth: 2.5 })
        : null,
      show.median
        ? Plot.ruleX([statSummary.median], { stroke: 'green', strokeWidth: 2.5 })
        : null,
      show.sd
        ? Plot.ruleX([statSummary.mean - statSummary.standardDeviation, statSummary.mean + statSummary.standardDeviation], { stroke: 'grey', strokeWidth: 2.5 })
        : null,
      Plot.ruleY([0]),
      Plot.ruleX([minmax[0]]),
    ],
  });
}

export function makeDistributionPlot(values: number[]): ((SVGSVGElement | HTMLElement) & PlotType) {
  const boxPlotSize = 20; // 20 %
  const rawDataSize = 14; // 14 %
  const rawDataOffset = 5; // 5 %
  // Should the box plot be centered on the middle of the raw data (true) or
  // on the X axis of the histogram (false)?
  const offsetFlag = true;

  // [min, max] of the values
  const valuesExtent = extent(values);

  const accessorFn = (d: number) => d; // Accessor function for the values
  // Number of bins in the histogram (approximate)
  const nbBins = d3.thresholdFreedmanDiaconis(values, valuesExtent[0], valuesExtent[1]) * 1.3;

  // The actual bins
  const bins = d3.bin().domain(valuesExtent).thresholds(nbBins);

  // Maximum value in Y axis for the density plot
  const maxTotal = max(bins(values).map((d: number[]) => d3.sum(d))) / d3.sum(values);

  // Position of the box plot
  const boxPlotOffset = (Number(offsetFlag) * (rawDataOffset + rawDataSize / 2) * maxTotal) / 100;

  // Random position on the Y axis for the raw data
  const jitter = (data: number[]) => data
    .map(() => (-(Math.random() * rawDataSize + rawDataOffset) * maxTotal) / 100);

  // Graphical mark for the box plot
  const boxPlotX = [
    Plot.ruleX(
      values,
      Plot.groupZ(
        {
          x: 'median',
        },
        {
          x: accessorFn,
          y1: -boxPlotOffset - (boxPlotSize * maxTotal) / 100 / 2,
          y2: -boxPlotOffset + (boxPlotSize * maxTotal) / 100 / 2,
          strokeWidth: 3,
          stroke: '#333333',
        },
      ),
    ),
    Plot.rectX(
      values,
      Plot.groupZ(
        {
          x1: lowerQuartile,
          x2: upperQuartile,
        },
        {
          x: accessorFn,
          y1: -boxPlotOffset - (boxPlotSize * maxTotal) / 100 / 2,
          y2: -boxPlotOffset + (boxPlotSize * maxTotal) / 100 / 2,
          stroke: '#333333',
          strokeWidth: 1.5,
        },
      ),
    ),
    Plot.ruleY(
      values,
      Plot.groupY(
        {
          x1: lowerWhisker,
          x2: lowerQuartile,
        },
        {
          x: accessorFn,
          y: -boxPlotOffset,
          stroke: '#333333',
          strokeWidth: 1.5,
        },
      ),
    ),
    Plot.ruleY(
      values,
      Plot.groupY(
        {
          x1: upperQuartile,
          x2: upperWhisker,
        },
        {
          x: accessorFn,
          y: -boxPlotOffset,
          stroke: '#333333',
          strokeWidth: 1.5,
        },
      ),
    ),
  ];

  // Graphical mark for the raw data (jittered)
  const rawDataX = Plot.dot(values, {
    x: accessorFn,
    y: jitter(values),
    stroke: '#aeaeae',
    strokeWidth: 1.25,
    fill: '#4f4f4f',
    r: 2,
  });

  // Graphical mark for the histogram (proportion, not count)
  const histFreqX = Plot.rectY(
    values,
    Plot.binX(
      { y: 'proportion' },
      {
        x: accessorFn,
        thresholds: nbBins,
      },
    ),
  );

  // Density line, based on the histogram
  const densX = Plot.lineY(
    values,
    Plot.binX(
      { y: 'proportion', filter: null },
      {
        x: accessorFn,
        thresholds: nbBins,
        curve: 'basis',
        stroke: 'red',
        strokeWidth: 3,
      },
    ),
  );

  // The actual plot
  return Plot.plot({
    height: 260,
    insetLeft: 10,
    marginBottom: 20,
    marginRight: 15,
    marginTop: 10,
    marginLeft: 30,
    marks: [
      Plot.ruleY([0]),
      histFreqX,
      densX,
      rawDataX,
      boxPlotX,
    ],
    y: {
      ticks: 4,
      tickFormat: (d) => (d < 0 ? '' : d),
      label: null,
    },
    x: {
      domain: d3.nice(...valuesExtent, 10),
      tickFormat: (d) => d.toLocaleString(),
      label: null,
    },
  });
}
