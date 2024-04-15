// Imports from solid-js
import type { JSX } from 'solid-js';
import { createSignal, For } from 'solid-js';

// Imports from other packages
import * as Plot from '@observablehq/plot';

// Helpers
import { round, toPrecisionAfterDecimalPoint } from '../../helpers/math';

// Styles
import '../../styles/LinearRegressionComponents.css';
import PlotFigure from '../PlotFigure.tsx';

function signifCode(p: number) {
  if (p < 0.001) return '***';
  if (p < 0.01) return '**';
  if (p < 0.05) return '*';
  if (p < 0.1) return '.';
  return '';
}

export interface LinearRegressionOptions {
  x: string,
  y: string,
  logX: boolean,
  logY: boolean,
}

export interface MultipleLinearRegressionOptions {
  x: string[],
  y: string,
  logX: boolean[],
  logY: boolean,
}

export interface LinearRegressionResult {
  adjustedRSquared: number,
  rSquared: number,
  coefficients: number[],
  residuals: number[],
  fittedValues: number[],
  pearson: number,
  spearman: number,
  ignored: number,
  standardisedResiduals: number[],
  residualStandardError: number,
  lowessFittedResiduals: { x: number[], y: number[] },
  lowessStandardisedResiduals: { x: number[], y: number[] },
  qqPoints: { x: number[], y: number[] },
  qqLine: { slope: number, intercept: number },
  code: string,
  options: LinearRegressionOptions,
}

export interface MultipleLinearRegressionResult {
  rSquared: number,
  adjustedRSquared: number,
  coefficients: number[],
  residuals: number[],
  fittedValues: number[],
  standardisedResiduals: number[],
  residualStandardError: number,
  ignored: number,
  options: MultipleLinearRegressionOptions,
  lowessFittedResiduals: { x: number[], y: number[] },
  lowessStandardisedResiduals: { x: number[], y: number[] },
  qqPoints: { x: number[], y: number[] },
  qqLine: { slope: number, intercept: number },
  code: string,
}

interface LmSummaryProps {
  id: string;
  summary: LinearRegressionResult | MultipleLinearRegressionResult;
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

export function LmSummary(props: LmSummaryProps): JSX.Element {
  const [showDetails, setShowDetails] = createSignal(false);

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

  return <div id={props.id} class="lm-summary">
    <h5>Coefficients</h5>
    <table class="table-simple">
      <thead>
      <tr>
        <For each={makeLabels(props.summary)}>
          {(label) => <th>{label}</th>}
        </For>
      </tr>
      </thead>
      <tbody>
      <tr>
        <For each={Object.keys(props.summary.coefficients)}>
          {(k, i) => <td>{toPrecisionAfterDecimalPoint(props.summary.coefficients[k][0], 3)}</td>}
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
      <For each={Object.keys(props.summary.coefficients)}>
        {(k, i) => <tr>
          <td>{ makeLabels(props.summary)[i()] }</td>
          <td>{toPrecisionAfterDecimalPoint(props.summary.coefficients[k][0], 4)}</td>
          <td>{toPrecisionAfterDecimalPoint(props.summary.coefficients[k][1], 4)}</td>
          <td>{toPrecisionAfterDecimalPoint(props.summary.coefficients[k][2], 2)}</td>
          <td>
            {
              props.summary.coefficients[k][3] < 2e-16
                ? '<2e-16'
                : toPrecisionAfterDecimalPoint(props.summary.coefficients[k][3], 4)
            }
          </td>
          <td>{signifCode(props.summary.coefficients[k][3])}</td>
        </tr>}
      </For>
      </tbody>
    </table>
    {/* <p>---<br />Signif. codes:  0 ‘***’ 0.001 ‘**’ 0.01 ‘*’ 0.05 ‘.’ 0.1 ‘ ’ 1</p> */}
    <p>
      Multiple R-squared: {round(props.summary.rSquared, 4)},
      Adjusted R-squared: {round(props.summary.adjustedRSquared, 4)}
      <br />
      Residual standard error: {round(props.summary.residualStandardError, 4)}
      &nbsp;on {props.summary.residuals.filter((d) => d !== null).length - 2} degrees of freedom
      {props.summary.ignored !== null && props.summary.ignored > 0 ? <><br/>&nbsp;&nbsp;&nbsp;&nbsp;({props.summary.ignored} observations deleted as missing)</> : ''}
    </p>
  </div>;
}
