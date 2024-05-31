// Imports from solid-js
import {
  createMemo, createSignal, For, JSX,
} from 'solid-js';

// Imports from other packages
import * as Plot from '@observablehq/plot';
import { BsCheckAll, BsCheckLg } from 'solid-icons/bs';

// Subcomponents
import PlotFigure from '../PlotFigure.tsx';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { isFiniteNumber } from '../../helpers/common';
import {
  Mfloor, extent,
  toPrecisionAfterDecimalPoint,
  Mabs, Msqrt, Mceil,
} from '../../helpers/math';

// Types / Interfaces / Enums
import {
  LinearRegressionResult,
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
    x: {
      label: 'Fitted',
      tickFormat: (d) => d.toLocaleString(),
    },
    y: {
      label: 'Square root of standardized residuals',
      tickFormat: (d) => d.toLocaleString(),
    },
    marks: [
      Plot.dot(d1, {
        x: 'Fitted',
        y: 'Residuals',
        fill: 'black',
        stroke: 'currentColor',
      }),
      Plot.line(d2, {
        x: 'x',
        y: 'y',
        stroke: 'red',
        curve: 'linear',
      }),
      Plot.gridX({ stroke: 'currentColor', strokeOpacity: '0.2' }),
      Plot.gridY({ stroke: 'currentColor', strokeOpacity: '0.2' }),
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
    x: {
      label: 'Fitted',
      tickFormat: (d) => d.toLocaleString(),
    },
    y: {
      label: 'Residuals',
      tickFormat: (d) => d.toLocaleString(),
    },
    marks: [
      Plot.dot(d1, {
        x: 'Fitted',
        y: 'Residuals',
        fill: 'black',
        stroke: 'currentColor',
      }),
      Plot.ruleY([0], { stroke: '#0c0c67', strokeDasharray: '3 5' }),
      Plot.line(d2, {
        x: 'x',
        y: 'y',
        stroke: 'red',
        curve: 'linear',
      }),
      Plot.gridX({ stroke: 'currentColor', strokeOpacity: '0.2' }),
      Plot.gridY({ stroke: 'currentColor', strokeOpacity: '0.2' }),
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
    x: {
      label: 'Theoretical quantiles',
      tickFormat: (d) => d.toLocaleString(),
    },
    y: {
      label: 'Standardized residuals',
      tickFormat: (d) => d.toLocaleString(),
    },
    marks: [
      Plot.line(d2, {
        x: 'x',
        y: 'y',
        stroke: 'currentColor',
        strokeWidth: 0.5,
        curve: 'linear',
        strokeDasharray: '3 5',
      }),
      Plot.dot(points, {
        x: 'x',
        y: 'y',
        fill: 'black',
        stroke: 'currentColor',
      }),
      Plot.gridX({ stroke: 'currentColor', strokeOpacity: 0.15 }),
      Plot.gridY({ stroke: 'currentColor', strokeOpacity: 0.15 }),
    ],
  };
}

export function makeOptionsStandardisedResidualsColors(
  dataset: Record<string, any>[],
  lm: LinearRegressionResult | MultipleLinearRegressionResult,
  colors: string[],
  breaks: number[],
  idVariable: string | undefined,
) {
  const filteredStandardisedResiduals = lm.standardisedResiduals
    .filter((r: number | null) => r !== null) as number[];
  const d = filteredStandardisedResiduals
    .map((r: number, i: number) => {
      const o = {
        'Standardized residuals': r,
        index: i,
      };
      if (idVariable) {
        o[idVariable] = dataset[i][idVariable];
      }
      return o;
    });

  const extt = extent(filteredStandardisedResiduals);
  const domain = [
    Mfloor(extt[0] - 0.5),
    Mceil(extt[1] + 0.5),
  ];

  return {
    x: {
      tickFormat: (t) => t.toLocaleString(),
    },
    y: {
      grid: true,
      fontSize: 30,
      domain,
      tickFormat: (t) => t.toLocaleString(),
    },
    height: 200,
    color: {
      type: 'threshold',
      range: colors,
      legend: true,
      domain: breaks,
    },
    marks: [
      ...breaks.map((v) => Plot.ruleY([v], { stroke: '#783c74', strokeDasharray: '3 5' })),
      Plot.dot(d, {
        x: 'index',
        y: 'Standardized residuals',
        fill: 'Standardized residuals',
        stroke: 'currentColor',
        strokeWidth: 0.5,
        r: 4,
        tip: true,
        title: (dt) => [
          idVariable ? dt[idVariable] : '',
          `Standardized residual: ${dt['Standardized residuals'].toFixed(2)}`,
        ].join('\n'),
      }),
    ],
  };
}

export function ScatterPlot(
  props: {
    dataset: Record<string, any>[],
    explainedVariable: string,
    explanatoryVariable: string,
    logX?: boolean,
    logY?: boolean,
    drawLine?: boolean,
  },
): JSX.Element {
  const ds = createMemo(() => props.dataset.map((d) => {
    if (
      isFiniteNumber(d[props.explainedVariable])
      && isFiniteNumber(d[props.explanatoryVariable])
    ) {
      return {
        [props.explainedVariable]: +d[props.explainedVariable],
        [props.explanatoryVariable]: +d[props.explanatoryVariable],
      };
    }
    return null;
  }).filter((d) => d !== null));

  const minX = createMemo(() => {
    const [min, max] = extent(ds().map((d) => d[props.explanatoryVariable]));
    const p03 = 0.03 * (max - min);
    return Mfloor(min - p03);
  });
  const minY = createMemo(() => {
    const [min, max] = extent(ds().map((d) => d[props.explainedVariable]));
    const p03 = 0.03 * (max - min);
    return Mfloor(min - p03);
  });
  return <PlotFigure
    id="scatter-plot"
    options={{
      height: 300,
      width: 400,
      grid: true,
      marginLeft: 60,
      x: {
        label: props.explanatoryVariable,
        tickFormat: (d) => d.toLocaleString(),
      },
      y: {
        label: props.explainedVariable,
        tickFormat: (d) => d.toLocaleString(),
      },
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
        Plot.gridX({ stroke: 'currentColor', strokeOpacity: '0.2' }),
        Plot.gridY({ stroke: 'currentColor', strokeOpacity: '0.2' }),
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
          text: (d) => (+d.correlation.toFixed(2)).toLocaleString(),
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
  const { LL } = useI18nContext();
  const [showDetails, setShowDetails] = createSignal(false);

  return <div class="lm-summary">
    <h5>{ LL().FunctionalitiesSection.LinearRegressionOptions.Coefficients() }</h5>
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
    <h5>{ LL().FunctionalitiesSection.LinearRegressionOptions.CoefficientsDetails() }</h5>
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
      {
        LL().FunctionalitiesSection.LinearRegressionOptions.RSE({
          value: toPrecisionAfterDecimalPoint(summary.residualStandardError, 4),
          dof: summary.residuals.filter((d) => d !== null).length - 2,
        })
      }
      {
        summary.ignored !== null && summary.ignored === 0
          ? ''
          : <><br />&nbsp;&nbsp;&nbsp;&nbsp;{
            LL().FunctionalitiesSection.LinearRegressionOptions
              .DeletedAsMissing({ value: summary.ignored })
          }</>
      }
      <br/>
      {
        LL().FunctionalitiesSection.LinearRegressionOptions.MultipleR2({
          value: toPrecisionAfterDecimalPoint(summary.rSquared, 4),
        })
      }&nbsp;-&nbsp;
      {
        LL().FunctionalitiesSection.LinearRegressionOptions.AdjustedR2({
          value: toPrecisionAfterDecimalPoint(summary.rSquared, 4),
        })
      }
    </p>
  </div>;
}

export function DiagnosticPlots(
  summary: LinearRegressionResult | MultipleLinearRegressionResult,
): JSX.Element {
  const { LL } = useI18nContext();
  return <>
    <h3 class="has-text-centered">
      {LL().FunctionalitiesSection.LinearRegressionOptions.DiagnosticPlots()}
    </h3>
    <h5 class="has-text-centered">
      {LL().FunctionalitiesSection.LinearRegressionOptions.ResidualVsFittedValues()}
    </h5>
    <div style={{ display: 'flex' }} class="mb-4">
      <PlotFigure id="residuals-vs-fitted" options={makeOptionsResidualsFittedPlot(summary)} style={{ width: '50%' }} />
      <div style={{ width: '50%', 'text-align': 'left', margin: 'auto' }}>
        <p>{LL().FunctionalitiesSection.LinearRegressionOptions.ResidualVsFittedInfo1()}</p>
        <ul>
          <li>{LL().FunctionalitiesSection.LinearRegressionOptions.ResidualVsFittedInfo2()}</li>
          <li>{LL().FunctionalitiesSection.LinearRegressionOptions.ResidualVsFittedInfo3()}</li>
        </ul>
        <p>
          <BsCheckLg
            style={{ 'vertical-align': 'middle', 'margin-bottom': '0.15em', 'margin-right': '0.2em' }}
            size={'1.3em'}
          />
          {LL().FunctionalitiesSection.LinearRegressionOptions.ResidualVsFittedCheck()}
        </p>
      </div>
    </div>
    <h5 class="has-text-centered">
      {LL().FunctionalitiesSection.LinearRegressionOptions.ScaleLocation()}
    </h5>
    <div style={{ display: 'flex' }} class="mb-4">
      <PlotFigure id="scale-location" options={makeOptionsScaleLocationPlot(summary)} style={{ width: '50%' }} />
      <div style={{ width: '50%', 'text-align': 'left', margin: 'auto' }}>
        <p>{LL().FunctionalitiesSection.LinearRegressionOptions.ScaleLocationInfo1()}</p>
        <p>
          <BsCheckLg
            style={{ 'vertical-align': 'middle', 'margin-bottom': '0.15em', 'margin-right': '0.2em' }}
            size={'1.3em'}
          />
          {LL().FunctionalitiesSection.LinearRegressionOptions.ScaleLocationCheck()}
        </p>
      </div>
    </div>
    <h5 class="has-text-centered">
      {LL().FunctionalitiesSection.LinearRegressionOptions.QQ()}
    </h5>
    <div style={{ display: 'flex' }} class="mb-4">
      <PlotFigure id="qq-plot" options={makeOptionsQQPlot(summary)} style={{ width: '50%' }} />
      <div style={{ width: '50%', 'text-align': 'left', margin: 'auto' }}>
        <p>{LL().FunctionalitiesSection.LinearRegressionOptions.QQInfo1()}</p>
        <p>
          <BsCheckLg
            style={{ 'vertical-align': 'middle', 'margin-bottom': '0.15em', 'margin-right': '0.2em' }}
            size={'1.3em'}
          />
          {LL().FunctionalitiesSection.LinearRegressionOptions.QQCheck()}
        </p>
      </div>
    </div>
  </>;
}

export function InformationBeforeValidation(): JSX.Element {
  const { LL } = useI18nContext();
  return <>
    <h3 class="has-text-centered">{LL().FunctionalitiesSection.LinearRegressionOptions.RepresentationOptions()}</h3>
    <div class="mb-4" style={{ width: '70%', margin: 'auto' }}>
      <p>{LL().FunctionalitiesSection.LinearRegressionOptions.SummaryInfo1()}</p>
      <ul>
        <li>{LL().FunctionalitiesSection.LinearRegressionOptions.SummaryInfo2()}</li>
        <li>{LL().FunctionalitiesSection.LinearRegressionOptions.SummaryInfo3()}</li>
        <li>{LL().FunctionalitiesSection.LinearRegressionOptions.SummaryInfo4()}</li>
        <li>{LL().FunctionalitiesSection.LinearRegressionOptions.SummaryInfo5()}</li>
      </ul>
      <p>
        <BsCheckAll style={{ 'vertical-align': 'middle', 'margin-bottom': '0.2em', 'margin-right': '0.1em' }} size={'1.4em'} />
        {LL().FunctionalitiesSection.LinearRegressionOptions.SummaryInfo6()}
      </p>
    </div>
  </>;
}
