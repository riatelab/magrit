import {
  createEffect,
  createMemo,
  JSX,
  on,
  onMount,
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
import { isFiniteNumber } from '../../helpers/common';
import { findLayerById } from '../../helpers/layers';
import { extent, Mfloor } from '../../helpers/math';
import { LinearRegressionResult } from '../../helpers/statistics';

// Stores
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';
import { layersDescriptionStore } from '../../store/LayersDescriptionStore';
import { LinearRegressionScatterPlot } from '../../global';

const defaultSpacing = applicationSettingsStore.defaultLegendSettings.spacing;

function ScatterPlot(
  props: {
    dataset: Record<string, any>[],
    explainedVariable: string,
    explanatoryVariable: string,
    fontColor: string,
    logX?: boolean,
    logY?: boolean,
    dimension: [number, number],
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
    const p03 = min + 0.03 * (max - min);
    return Mfloor(min - p03);
  });

  const minY = createMemo(() => {
    const [min, max] = extent(ds().map((d) => d[props.explainedVariable]));
    const p03 = min + 0.03 * (max - min);
    return Mfloor(min - p03);
  });

  return <>
    {
      Plot.plot({
        width: props.dimension[0],
        height: props.dimension[1],
        grid: true,
        style: {
          color: props.fontColor,
        },
        x: {
          label: props.explanatoryVariable,
          tickFormat: (d) => d.toLocaleString(),
        },
        y: {
          label: props.explainedVariable,
          tickFormat: (d) => d.toLocaleString(),
        },
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
          Plot.linearRegressionY(ds(), {
            x: props.explanatoryVariable,
            y: props.explainedVariable,
            stroke: 'red',
          }),
          Plot.gridX({ stroke: 'currentColor', strokeOpacity: '0.2' }),
          Plot.gridY({ stroke: 'currentColor', strokeOpacity: '0.2' }),
        ],
      })
    }
  </>;
}

export default function lmScatterPlot(
  legend: LinearRegressionScatterPlot,
): JSX.Element {
  const { LL } = useI18nContext();
  let refElement: SVGGElement;

  const layer = findLayerById(layersDescriptionStore.layers, legend.layerId)!;

  const variableX = (layer.rendererParameters.lm as LinearRegressionResult)
    .options.x;

  const variableY = (layer.rendererParameters.lm as LinearRegressionResult)
    .options.y;

  const dataset = createMemo(() => {
    const a = [];
    layer.data.features.forEach((f) => {
      a.push({
        [variableX]: f.properties[variableX],
        [variableY]: f.properties[variableY],
      });
    });
    return a as Record<string, any>[];
  });

  const heightTitle = createMemo(() => (getTextSize(
    legend.title.text,
    legend.title.fontSize,
    legend.title.fontFamily,
  ).height + defaultSpacing));

  const heightSubtitle = createMemo(() => (legend.subtitle && legend.subtitle.text
    ? getTextSize(
      legend.subtitle.text,
      legend.subtitle.fontSize,
      legend.subtitle.fontFamily,
    ).height + defaultSpacing
    : 0));

  onMount(() => {
    // We need to wait for the legend to be rendered before we can compute its size
    // and bind the drag behavior and the mouse enter / leave behavior.
    bindElementsLegend(refElement, legend);
  });

  // Recompute the size of the rectangle box when the legend is updated
  createEffect(
    on(
      () => [heightTitle(), heightSubtitle(), legend.height, legend.width, legend.note?.text],
      () => {
        computeRectangleBox(refElement);
      },
    ),
  );

  return <g
    ref={refElement!}
    id={legend.id}
    class="legend lm-scatter-plot"
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
      <ScatterPlot
        dataset={dataset()}
        explainedVariable={variableY}
        explanatoryVariable={variableX}
        logX={false}
        logY={false}
        dimension={[legend.width, legend.height]}
        fontColor={legend.fontColor}
      />
    </g>
    {
      makeLegendText(
        legend.note,
        [legend.width / 2, heightTitle() + heightSubtitle() + legend.height],
        'note',
        { 'text-anchor': 'middle' },
      )
    }
  </g>;
}
