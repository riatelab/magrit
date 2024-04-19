// Imports from solid-js
import {
  createMemo, createSignal, For, JSX,
} from 'solid-js';

// Imports from other packages
import * as Plot from '@observablehq/plot';

// Subcomponents
import PlotFigure from '../PlotFigure.tsx';

// Helpers
import {
  Mfloor, extent, round,
  toPrecisionAfterDecimalPoint, Mabs, Msqrt,
} from '../../helpers/math';

// Types / Interfaces / Enums
import {
  LinearRegressionOptions,
  LinearRegressionResult,
  MultipleLinearRegressionOptions,
  MultipleLinearRegressionResult,
} from '../../helpers/statistics';

// Styles
import '../../styles/LinearRegressionComponents.css';

function signifCode(p: number) {
  if (p < 0.001) return '***';
  if (p < 0.01) return '**';
  if (p < 0.05) return '*';
  if (p < 0.1) return '.';
  return '';
}

interface LmSummaryProps {
  id: string;
  summary: LinearRegressionResult | MultipleLinearRegressionResult;
}

export function makeOptionsScaleLocationPlot(
  lm: LinearRegressionResult | MultipleLinearRegressionResult,
) {
  const d1 = (lm.standardisedResiduals
    .filter((r) => r !== null) as number[])
    .map((r: number, i: number) => ({
      Fitted: lm.fittedValues[i],
      Residuals: Msqrt(Mabs(r)),
    }));

  const d2 = lm.lowessStandardisedResiduals.x
    .map((x: number, i: number) => ({ x, y: lm.lowessStandardisedResiduals.y[i] }));

  return {
    grid: true,
    x: { label: 'Fitted' },
    y: { label: 'Square root of standardized residuals' },
    marks: [
      Plot.dot(d1, {
        x: 'Fitted',
        y: 'Residuals',
        fill: 'lightgray',
        stroke: 'black',
      }),
      Plot.line(d2, {
        x: 'x',
        y: 'y',
        stroke: 'red',
        curve: 'linear',
      }),
    ],
  };
}

export function makeOptionsResidualsFittedPlot(
  lm: LinearRegressionResult | MultipleLinearRegressionResult,
) {
  const d1 = lm.residuals
    .map((r: number | null, i: number) => ({ Fitted: lm.fittedValues[i], Residuals: r, Index: i }));
  const d2 = lm.lowessFittedResiduals.x
    .map((x: number, i: number) => ({ x, y: lm.lowessFittedResiduals.y[i] }));

  return {
    grid: true,
    x: { label: 'Fitted' },
    y: { label: 'Residuals' },
    marks: [
      Plot.dot(d1, {
        x: 'Fitted',
        y: 'Residuals',
        fill: 'lightgray',
        stroke: 'black',
      }),
      Plot.ruleY([0], { stroke: '#0c0c67', strokeDasharray: '3 5' }),
      Plot.line(d2, {
        x: 'x',
        y: 'y',
        stroke: 'red',
        curve: 'linear',
      }),
    ],
  };
}

export function makeOptionsQQPlot(lm: LinearRegressionResult | MultipleLinearRegressionResult) {
  const points = lm.qqPoints.x
    .map((x: number, i: number) => ({ x, y: lm.qqPoints.y[i] }));

  const d2 = [
    { x: -3, y: -3 * lm.qqLine.slope + lm.qqLine.intercept },
    { x: 3, y: 3 * lm.qqLine.slope + lm.qqLine.intercept },
  ];

  return {
    grid: true,
    x: { label: 'Theoretical quantiles' },
    y: { label: 'Standardized residuals' },
    marks: [
      Plot.line(d2, {
        x: 'x',
        y: 'y',
        stroke: 'black',
        strokeWidth: 0.5,
        curve: 'linear',
        strokeDasharray: '3 5',
      }),
      Plot.dot(points, {
        x: 'x',
        y: 'y',
        fill: 'lightgray',
        stroke: 'black',
      }),
    ],
  };
}

export function ScatterPlot(
  props: {
    dataset: Record<string, any>[],
    explainedVariable: string,
    explanatoryVariable: string,
    drawLine?: boolean,
  },
): JSX.Element {
  const ds = createMemo(() => props.dataset.map((d) => ({
    [props.explanatoryVariable]: +d[props.explanatoryVariable],
    [props.explainedVariable]: +d[props.explainedVariable],
  })));
  const minX = createMemo(() => {
    const [min, max] = extent(ds().map((d) => d[props.explanatoryVariable]));
    const p03 = min + 0.03 * (max - min);
    return Mfloor(min - p03);
  });
  const minY = createMemo(() => {
    const [min, max] = extent(ds().map((d) => d[props.explainedVariable]));
    const p03 = min + 0.03 * (max - min);
    return Mfloor(min - p03);
  });
  return <PlotFigure
    id="scatter-plot"
    options={{
      height: 300,
      width: 400,
      grid: true,
      marginLeft: 60,
      marks: [
        Plot.dot(ds(), {
          x: props.explanatoryVariable,
          y: props.explainedVariable,
          // fill: 'currentColor',
          stroke: 'green',
        }),
        Plot.ruleX([minX()]),
        Plot.ruleY([minY()]),
        // Plot.frame(),
        props.drawLine ? Plot.linearRegressionY(ds(), {
          x: props.explanatoryVariable,
          y: props.explainedVariable,
          stroke: 'red',
        }) : null,
      ],
    }}
    style={{ margin: 'auto' }}
  />;
}

export function CorrelationMatrix(
  props: {
    matrix: { a: string, b: string, correlation: number }[],
  },
): JSX.Element {
  return <PlotFigure
    id="dataset-preview"
    options={{
      height: 600,
      width: 800,
      label: null,
      marginLeft: 120,
      color: {
        scheme: 'PiYG', pivot: 0, legend: true, label: 'correlation',
      },
      marks: [
        Plot.cell(props.matrix, {
          x: 'a', y: 'b', fill: 'correlation', rx: 5,
        }),
        Plot.text(props.matrix, {
          x: 'a',
          y: 'b',
          text: (d) => d.correlation.toFixed(2),
          fill: (d) => (Math.abs(d.correlation) > 0.6 ? 'white' : 'black'),
        }),
        Plot.axisX({ lineWidth: 7, marginBottom: 50 }),
        Plot.axisY({ lineWidth: 7 }),
      ],
    }}
    style={{ margin: 'auto' }}
  />;
}

function makeLabels(summary: LinearRegressionResult | MultipleLinearRegressionResult) {
  const labels: string[] = [];
  if (Object.keys(summary.coefficients).length > 1) {
    labels.push('(Intercept)');
  }
  if (typeof summary.options.x === 'string') {
    labels.push(summary.options.logX ? `log(${summary.options.x})` : summary.options.x);
  } else {
    labels.push(...summary.options.x);
  }
  return labels;
}

export function LmSummary(
  summary: LinearRegressionResult | MultipleLinearRegressionResult,
): JSX.Element {
  const [showDetails, setShowDetails] = createSignal(false);

  return <div class="lm-summary">
    <h5>Coefficients</h5>
    <table class="table-simple">
      <thead>
      <tr>
        <For each={makeLabels(summary)}>
          {(label) => <th>{label}</th>}
        </For>
      </tr>
      </thead>
      <tbody>
      <tr>
        <For each={Object.keys(summary.coefficients)}>
          {(k, i) => <td>{toPrecisionAfterDecimalPoint(summary.coefficients[k][0], 3)}</td>}
        </For>
      </tr>
      </tbody>
    </table>
    <h5>Coefficients (details)</h5>
    <table class="table-details">
      <thead>
      <tr>
        <th />
        <th>Estimate</th>
        <th>Std. Error</th>
        <th>t-value</th>
        <th>Pr(&gt;|t|)</th>
        <th />
      </tr>
      </thead>
      <tbody>
      <For each={Object.keys(summary.coefficients)}>
        {(k, i) => <tr>
          <td>{ makeLabels(summary)[i()] }</td>
          <td>{toPrecisionAfterDecimalPoint(summary.coefficients[k][0], 4)}</td>
          <td>{toPrecisionAfterDecimalPoint(summary.coefficients[k][1], 4)}</td>
          <td>{toPrecisionAfterDecimalPoint(summary.coefficients[k][2], 2)}</td>
          <td>
            {
              summary.coefficients[k][3] < 2e-16
                ? '<2e-16'
                : toPrecisionAfterDecimalPoint(summary.coefficients[k][3], 4)
            }
          </td>
          <td>{signifCode(summary.coefficients[k][3])}</td>
        </tr>}
      </For>
      </tbody>
    </table>
    {/* <p>---<br />Signif. codes:  0 ‘***’ 0.001 ‘**’ 0.01 ‘*’ 0.05 ‘.’ 0.1 ‘ ’ 1</p> */}
    <p>
      Multiple R-squared: {round(summary.rSquared, 4)},
      Adjusted R-squared: {round(summary.adjustedRSquared, 4)}
      <br />
      Residual standard error: {round(summary.residualStandardError, 4)}
      &nbsp;on {summary.residuals.filter((d) => d !== null).length - 2} degrees of freedom
      {summary.ignored !== null && summary.ignored > 0 ? <><br/>&nbsp;&nbsp;&nbsp;&nbsp;({summary.ignored} observations deleted as missing)</> : ''}
    </p>
  </div>;
}
