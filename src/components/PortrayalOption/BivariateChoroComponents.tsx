// Imports from solid-js
import {
  type JSX,
  Accessor,
} from 'solid-js';

// Imports from other libraries
import * as Plot from '@observablehq/plot';

// Subcomponents
import PlotFigure from '../PlotFigure.tsx';
import { BivariateChoroplethParameters } from '../../global';

// eslint-disable-next-line import/prefer-default-export
export function BivariateDistributionPlot(
  props: {
    ds: { [x: string]: number | undefined }[],
    currentClassifInfo: Accessor<BivariateChoroplethParameters>,
    bivariateClasses: (d: Record<string, any>) => number[],
    classifierVar1: () => { breaks: number[] },
    classifierVar2: () => { breaks: number[] },
    bc: (d: Record<string, any>) => number,
  },
): JSX.Element {
  return <PlotFigure
    id={'scatter-plot-bivariate-distribution'}
    options={{
      height: 380,
      x: {
        label: props.currentClassifInfo().variable2.variable,
        reverse: props.currentClassifInfo().variable2.reversed,
      },
      y: {
        label: props.currentClassifInfo().variable1.variable,
        reverse: props.currentClassifInfo().variable1.reversed,
      },
      marks: [
        Plot.dot(props.ds, {
          y: props.currentClassifInfo().variable1.variable,
          x: props.currentClassifInfo().variable2.variable,
          fill: (d) => props.currentClassifInfo().palette.colors[props.bc(d)],
          r: 3,
          tip: true,
        }),
        Plot.text(
          props.ds,
          Plot.groupZ(
            { text: 'count', x: 'mean', y: 'mean' },
            {
              fontSize: 14,
              stroke: 'width',
              strokeWidth: 8,
              fill: 'black',
              y: props.currentClassifInfo().variable1.variable,
              x: props.currentClassifInfo().variable2.variable,
              z: (d) => props.bivariateClasses(d).toString(),
            },
          ),
        ),
        Plot.ruleX([
          props.classifierVar2().breaks[props.currentClassifInfo().variable2.reversed ? 3 : 0],
        ], { }),
        Plot.ruleY([
          props.classifierVar1().breaks[props.currentClassifInfo().variable1.reversed ? 3 : 0],
        ], { }),
        props.classifierVar2().breaks.slice(1, -1).map((vx: number) => [
          Plot.ruleX([vx], { strokeDasharray: 4, strokeOpacity: 0.4 }),
        ]),
        props.classifierVar1().breaks.slice(1, -1).map((vy: number) => [
          Plot.ruleY([vy], { strokeDasharray: 4, strokeOpacity: 0.4 }),
        ]),
      ],
    }}
  />;
}
