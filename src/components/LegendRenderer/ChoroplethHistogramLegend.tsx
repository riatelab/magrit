import {
  createEffect,
  createMemo,
  type JSX,
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
import { findLayerById } from '../../helpers/layers';

// Stores
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';
import { layersDescriptionStore } from '../../store/LayersDescriptionStore';

// Type
import {
  type ChoroplethHistogramLegend,
  type ClassificationParameters,
  type LayerDescription,
  type LayerDescriptionProportionalSymbols,
  type ProportionalSymbolsRatioParameters,
} from '../../global.d';

const defaultSpacing = applicationSettingsStore.defaultLegendSettings.spacing;

function ChoroplethHistogram(
  props: {
    classification: ClassificationParameters,
    color: string,
    height: number,
    width: number,
  },
): JSX.Element {
  const minmax = [
    props.classification.breaks[0],
    props.classification.breaks[props.classification.breaks.length - 1],
  ];

  const breaksData = createMemo(() => {
    const bd = [];

    for (let i = 0; i < props.classification.breaks.length - 1; i += 1) {
      bd.push({
        x1: props.classification.breaks[i],
        x2: props.classification.breaks[i + 1],
        y: props.classification.entitiesByClass[i] / (
          props.classification.breaks[i + 1] - props.classification.breaks[i]),
        count: props.classification.entitiesByClass[i],
        color: props.classification.palette.colors[i],
      });
    }

    return bd;
  });

  return <>{
    Plot.plot({
      height: props.height,
      width: props.width,
      style: { color: props.color },
      marginBottom: 40,
      marginLeft: 20,
      x: {
        domain: minmax,
        tickFormat: (d) => d.toLocaleString(),
        tickRotate: -30,
        ticks: props.classification.breaks.slice(1, -1),
      },
      y: {
        nice: false,
        grid: true,
        ticks: false,
      },
      marks: [
        Plot.rectY(breaksData(), {
          x1: (d) => d.x1,
          x2: (d) => d.x2,
          y: (d) => d.y,
          fill: (d) => d.color,
        }),
        Plot.ruleY([0]),
        // Plot.ruleX([minmax[0]]),
      ],
    }) as SVGSVGElement
  }</>;
}

export default function legendChoroplethHistogram(
  legend: ChoroplethHistogramLegend,
): JSX.Element {
  const { LL } = useI18nContext();
  let refElement: SVGGElement;

  const layer = findLayerById(
    layersDescriptionStore.layers,
    legend.layerId,
  )!;

  function getClassificationParameters(layerDescription: LayerDescription) {
    if (layerDescription.renderer === 'choropleth') {
      return layerDescription.rendererParameters as ClassificationParameters;
    }
    if (
      layerDescription.renderer === 'proportionalSymbols'
      && (layerDescription as LayerDescriptionProportionalSymbols).rendererParameters.colorMode === 'ratioVariable'
    ) {
      return (layerDescription.rendererParameters as ProportionalSymbolsRatioParameters).color;
    }
    throw new Error('Invalid reference layer');
  }

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
      <ChoroplethHistogram
        classification={getClassificationParameters(layer)}
        color={legend.fontColor}
        width={legend.width}
        height={legend.height}
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
