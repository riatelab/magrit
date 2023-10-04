// Imports from Plot
import * as Plot from '@observablehq/plot';
import type { Plot as PlotType } from '@observablehq/plot';

// D3 and math helpers
import d3 from '../helpers/d3-custom';
import {
  getBandwidth,
  extent,
  lowerQuartile,
  lowerWhisker,
  max,
  upperQuartile,
  upperWhisker,
} from '../helpers/math';

export default function makeDistributionPlot(values: number[]): (SVGSVGElement & PlotType) {
  const boxPlotSize = 20; // 20 %
  const rawDataSize = 14; // 15 %
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
    insetLeft: 10,
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
      label: null,
    },
    marginBottom: 20,
    marginRight: 15,
    marginTop: 10,
    marginLeft: 25,
    height: 320,
  });
}
