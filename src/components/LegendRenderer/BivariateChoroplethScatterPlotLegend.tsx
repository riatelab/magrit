import {
  createEffect,
  createMemo,
  type JSX,
  on,
  onMount,
  Show,
} from 'solid-js';

// Import from other libraries
import * as Plot from '@observablehq/plot';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import {
  bindElementsLegend, computeRectangleBox,
  getTextSize,
  makeLegendSettingsModal,
  makeLegendText,
  RectangleBox,
  triggerContextMenuLegend,
} from './common.tsx';
import { isFiniteNumber, precisionToMinimumFractionDigits } from '../../helpers/common';
import { findLayerById } from '../../helpers/layers';
import { max, min, round } from '../../helpers/math';
import { bivariateClass, getClassifier } from '../../helpers/classification';

// Stores
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';
import { layersDescriptionStore } from '../../store/LayersDescriptionStore';

// Type
import {
  type BivariateChoroplethScatterplotLegend,
  type BivariateChoroplethParameters,
  type LayerDescription,
  type LayerDescriptionBivariateChoropleth,
  type LegendTextElement,
  type BivariateVariableDescription,
  ClassificationMethod,
} from '../../global.d';

const defaultSpacing = applicationSettingsStore.defaultLegendSettings.spacing;

function BivariateChoroScatterPlot(
  props: BivariateChoroplethScatterplotLegend & {
    dataset: Record<string, never>[],
    variable1: BivariateVariableDescription,
    variable2: BivariateVariableDescription,
    colors: string[],
  },
): JSX.Element {
  const ds = createMemo(() => props.dataset.map((d) => {
    if (
      isFiniteNumber(d[props.variable1.variable])
      && isFiniteNumber(d[props.variable2.variable])
    ) {
      return {
        [props.variable1.variable]: +d[props.variable1.variable],
        [props.variable2.variable]: +d[props.variable2.variable],
      };
    }
    return null;
  }).filter((d) => d !== null));

  const formatValue = (v: number) => round(v, props.roundDecimals)
    .toLocaleString(
      applicationSettingsStore.userLocale,
      {
        minimumFractionDigits: precisionToMinimumFractionDigits(
          props.roundDecimals,
        ),
      },
    );

  const classifierVar1 = createMemo(() => {
    const Cls = getClassifier(ClassificationMethod.manual);
    return new Cls(
      null,
      null,
      applicationSettingsStore.intervalClosure,
      props.variable1.breaks,
    );
  });

  const classifierVar2 = createMemo(() => {
    const Cls = getClassifier(ClassificationMethod.manual);
    return new Cls(
      null,
      null,
      applicationSettingsStore.intervalClosure,
      props.variable2.breaks,
    );
  });

  const bivariateClasses = (d: Record<string, never>) => {
    const classVar1 = !props.variable1.reversed
      ? classifierVar1().getClass(d[props.variable1.variable])
      : 2 - classifierVar1().getClass(d[props.variable1.variable]);
    const classVar2 = !props.variable2.reversed
      ? classifierVar2().getClass(d[props.variable2.variable])
      : 2 - classifierVar2().getClass(d[props.variable2.variable]);
    return [classVar1, classVar2];
  };

  const bc = (d: Record<string, never>) => bivariateClass(
    d[props.variable1.variable],
    d[props.variable2.variable],
    classifierVar1(),
    classifierVar2(),
    props.variable1.reversed,
    props.variable2.reversed,
  );

  const countByClass = createMemo(() => {
    const cbc: Record<string, number> = {};
    ds().forEach((d) => {
      const t = bc(d);
      if (!cbc[t]) cbc[t] = 1;
      else cbc[t] += 1;
    });
    return cbc;
  });

  const ymargin = createMemo(() => (
    (classifierVar1().breaks[3] - classifierVar1().breaks[0]) * 0.025));
  const xmargin = createMemo(() => (
    (classifierVar2().breaks[3] - classifierVar2().breaks[0]) * 0.025));

  const rectCoords = createMemo(() => {
    const b1: number[] = [
      classifierVar1().breaks[0] - ymargin(),
      classifierVar1().breaks[1],
      classifierVar1().breaks[2],
      classifierVar1().breaks[3] + ymargin(),
    ];
    const b2: number[] = [
      classifierVar2().breaks[0] - xmargin(),
      classifierVar2().breaks[1],
      classifierVar2().breaks[2],
      classifierVar2().breaks[3] + xmargin(),
    ];
    const bk1 = props.variable1.reversed
      ? b1.slice().reverse()
      : b1;
    const bk2 = props.variable2.reversed
      ? b2.slice().reverse()
      : b2;

    return bk1
      .map((by: number, iy: number) => bk2
        .map((bx: number, ix: number) => [
          bx,
          bk2[ix + 1],
          by,
          bk1[iy + 1],
        ]))
      .flat()
      .filter((d) => d[0] && d[1] && d[2] && d[3]);
  });

  return <>
    <Show when={props.colorOn === 'dots'}>
      {
        Plot.plot({
          width: props.width,
          height: props.height,
          style: {
            color: props.axis.fontColor,
            fontFamily: props.axis.fontFamily,
            fontSize: `${props.axis.fontSize}px`,
            fontWeight: props.axis.fontWeight,
            fontStyle: props.axis.fontStyle,
          },
          x: {
            label: props.variable2Label,
            tickFormat: (d) => formatValue(d),
            reverse: props.variable2.reversed,
            domain: [
              classifierVar2().breaks[0] - xmargin(),
              classifierVar2().breaks[3] + xmargin(),
            ],
          },
          y: {
            label: props.variable1Label,
            tickFormat: (d) => formatValue(d),
            reverse: props.variable1.reversed,
            domain: [
              classifierVar1().breaks[0] - ymargin(),
              classifierVar1().breaks[3] + ymargin(),
            ],
          },
          marks: [
            Plot.linearRegressionY(ds(), {
              y: props.variable1.variable,
              x: props.variable2.variable,
              opacity: props.displayRegressionLine ? 0.5 : 0,
            }),
            Plot.dot(ds(), {
              y: props.variable1.variable,
              x: props.variable2.variable,
              fill: (d) => props.colors[bc(d)],
              // tip: true,
              r: props.radius,
            }),
            props.displayCountByClass ? Plot.text(
              ds(),
              Plot.groupZ(
                { text: 'count', x: 'mean', y: 'mean' },
                {
                  fontSize: 14,
                  stroke: 'white',
                  strokeWidth: 8,
                  fill: 'currentColor',
                  y: props.variable1.variable,
                  x: props.variable2.variable,
                  z: (d) => bivariateClasses(d).toString(),
                },
              ),
            ) : null,
            Plot.ruleX([
              classifierVar2().breaks[!props.variable1.reversed ? 0 : 3] + (
                props.variable1.reversed ? xmargin() : -xmargin()
              ),
            ], { }),
            Plot.ruleY([
              classifierVar1().breaks[!props.variable2.reversed ? 0 : 3] + (
                props.variable2.reversed ? ymargin() : -ymargin()
              ),
            ], { }),
            props.displayClassBreakLines
              ? classifierVar2().breaks.slice(1, -1).map((vx: number) => [
                Plot.ruleX([vx], { strokeDasharray: 4, strokeOpacity: 0.4 }),
              ]) : null,
            props.displayClassBreakLines
              ? classifierVar1().breaks.slice(1, -1).map((vy: number) => [
                Plot.ruleY([vy], { strokeDasharray: 4, strokeOpacity: 0.4 }),
              ]) : null,
          ],
        })
      }
    </Show>
    <Show when={props.colorOn === 'areas'}>
      {
        Plot.plot({
          width: props.width,
          height: props.height,
          style: {
            color: props.axis.fontColor,
            fontFamily: props.axis.fontFamily,
            fontSize: `${props.axis.fontSize}px`,
            fontWeight: props.axis.fontWeight,
            fontStyle: props.axis.fontStyle,
          },
          x: {
            label: props.variable2Label,
            tickFormat: (d) => formatValue(d),
            reverse: props.variable2.reversed,
          },
          y: {
            label: props.variable1Label,
            tickFormat: (d) => formatValue(d),
            reverse: props.variable1.reversed,
          },
          marks: [
            Plot.rect(
              rectCoords(),
              {
                x1: '0',
                y1: '2',
                x2: '1',
                y2: '3',
                fill: (d, i) => props.colors[i],
              },
            ),
            Plot.linearRegressionY(ds(), {
              y: props.variable1.variable,
              x: props.variable2.variable,
              opacity: props.displayRegressionLine ? 0.5 : 0,
            }),
            Plot.dot(ds(), {
              y: props.variable1.variable,
              x: props.variable2.variable,
              fill: props.dotColor,
              // tip: true,
              r: props.radius,
            }),
            props.displayCountByClass ? Plot.text(
              rectCoords(),
              {
                x: (d) => (d[0] + d[1]) / 2,
                y: (d) => (d[2] + d[3]) / 2,
                text: (d, i) => countByClass()[i],
                fontSize: 14,
                stroke: 'white',
                strokeWidth: 8,
                fill: 'currentColor',
              },
            ) : null,
            Plot.ruleX([
              classifierVar2().breaks[!props.variable1.reversed ? 0 : 3] + (
                props.variable1.reversed ? xmargin() : -xmargin()
              ),
            ], { }),
            Plot.ruleY([
              classifierVar1().breaks[!props.variable2.reversed ? 0 : 3] + (
                props.variable2.reversed ? ymargin() : -ymargin()
              ),
            ], { }),
          ],
        })
      }
    </Show>
  </>;
}

export default function legendChoroplethBivariateScatterPlot(
  legend: BivariateChoroplethScatterplotLegend,
): JSX.Element {
  const { LL } = useI18nContext();
  let refElement: SVGGElement;

  const layer = findLayerById(
    layersDescriptionStore.layers,
    legend.layerId,
  )! as LayerDescriptionBivariateChoropleth;

  const dataset = createMemo(() => {
    const a: Record<string, never>[] = [];
    layer.data.features.forEach((f) => {
      a.push({
        // eslint-disable-next-line max-len
        [layer.rendererParameters.variable1.variable]: f.properties![layer.rendererParameters.variable1.variable],
        // eslint-disable-next-line max-len
        [layer.rendererParameters.variable2.variable]: f.properties![layer.rendererParameters.variable2.variable],
      });
    });
    return a;
  });

  const heightTitle = createMemo(() => (getTextSize(
    legend.title.text,
    legend.title.fontSize,
    legend.title.fontFamily,
  ).height + defaultSpacing));

  const heightSubtitle = createMemo(() => (legend.subtitle.text
    ? getTextSize(
      legend.subtitle.text,
      legend.subtitle.fontSize,
      legend.subtitle.fontFamily,
    ).height
    : 0));

  onMount(() => {
    // We need to wait for the legend to be rendered before we can compute its size
    // and bind the drag behavior and the mouse enter / leave behavior.
    bindElementsLegend(refElement!, legend);
  });

  // Recompute the size of the rectangle box when the legend is updated
  createEffect(
    on(
      () => [
        heightTitle(),
        heightSubtitle(),
        legend.height,
        legend.width,
        legend.title.text,
        legend.subtitle.text,
        legend.note.text,
        legend.note.fontSize,
      ],
      () => {
        computeRectangleBox(refElement!);
      },
    ),
  );

  return <g
    ref={refElement!}
    id={legend.id}
    class="legend choropleth-histogram"
    for={layer.id}
    transform={`translate(${legend.position[0]}, ${legend.position[1]})`}
    visibility={layer.visible && legend.visible ? undefined : 'hidden'}
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLegend(e, legend.id, LL);
    }}
    onDblClick={() => { makeLegendSettingsModal(legend.id, LL); }}
    style={{ cursor: 'grab' }}
  >
    <RectangleBox backgroundRect={legend.backgroundRect}/>
    {makeLegendText(legend.title, [legend.width / 2, 0], 'title', { 'text-anchor': 'middle' })}
    {makeLegendText(legend.subtitle, [legend.width / 2, heightTitle()], 'subtitle', { 'text-anchor': 'middle' })}
    <g
      transform={`translate(0, ${heightTitle() + heightSubtitle()})`}
    >
      <BivariateChoroScatterPlot
        {...legend}
        dataset={dataset()}
        variable1={layer.rendererParameters.variable1}
        variable2={layer.rendererParameters.variable2}
        colors={layer.rendererParameters.palette.colors}
      />
    </g>
    {
      makeLegendText(
        legend.note,
        [legend.width / 2, heightTitle() + heightSubtitle() + legend.height + defaultSpacing],
        'note',
        { 'text-anchor': 'middle' },
      )
    }
  </g>;
}
