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
import { findLayerById } from '../../helpers/layers';

// Stores
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';
import { layersDescriptionStore } from '../../store/LayersDescriptionStore';

// Type
import {
  type CategoricalChoroplethBarchartLegend,
  type CategoricalChoroplethMapping,
  type CategoricalChoroplethParameters,
  type LayerDescription,
  type LayerDescriptionProportionalSymbols,
  type LegendTextElement,
  Orientation,
  type ProportionalSymbolCategoryParameters,
} from '../../global.d';

const defaultSpacing = applicationSettingsStore.defaultLegendSettings.spacing;

function CategoriesPlot(
  props: {
    mapping: CategoricalChoroplethMapping[],
    orientation: Orientation,
    order: 'ascending' | 'descending' | 'none',
    textProperties: LegendTextElement,
    height: number,
    width: number,
  },
): JSX.Element {
  const domain = createMemo(() => props.mapping.filter((m) => m.value).map((m) => m.categoryName));
  const range = createMemo(() => props.mapping.filter((m) => m.value).map((m) => m.color));
  const data = createMemo(() => props.mapping.filter((m) => m.value).map((m, i) => ({
    position: i,
    category: m.categoryName,
    color: m.color,
    frequency: m.count,
  })));
  const sizeLargestLabel = createMemo(() => Math.max(
    ...props.mapping.map((m) => getTextSize(
      m.categoryName || '',
      props.textProperties.fontSize,
      props.textProperties.fontFamily,
    ).width),
  ));

  return <>
  {
    props.orientation === 'horizontal'
      ? Plot.plot({
        style: {
          color: props.textProperties.fontColor,
          fontFamily: props.textProperties.fontFamily,
          fontSize: `${props.textProperties.fontSize}px`,
          fontWeight: props.textProperties.fontWeight,
          fontStyle: props.textProperties.fontStyle,
        },
        height: props.height,
        width: props.width,
        marginTop: 10,
        marginLeft: 12 + sizeLargestLabel(),
        color: { domain: domain(), range: range() },
        x: {
          label: null,
          nice: true,
          tickFormat: (d) => d.toLocaleString(),
        },
        y: {
          type: 'band',
          label: null,
        },
        marks: [
          Plot.gridX(),
          Plot.barX(
            data(),
            {
              y: 'category',
              x: 'frequency',
              fill: 'color',
              channels: { position: (d) => d.position },
              // eslint-disable-next-line no-nested-ternary
              sort: props.order === 'ascending'
                ? { y: 'x', order: 'ascending' }
                : props.order === 'descending'
                  ? { y: 'x', reverse: true }
                  : { y: 'position', order: 'ascending' },
            },
          ),
          Plot.ruleX([0]),
        ],
      }) as SVGSVGElement
      : Plot.plot({
        height: props.height,
        width: props.width,
        style: {
          color: props.textProperties.fontColor,
          fontFamily: props.textProperties.fontFamily,
          fontSize: `${props.textProperties.fontSize}px`,
          fontWeight: props.textProperties.fontWeight,
          fontStyle: props.textProperties.fontStyle,
        },
        marginTop: 10,
        marginBottom: 10 + 0.6 * sizeLargestLabel(),
        marginLeft: 30,
        color: { domain: domain(), range: range() },
        x: {
          type: 'band',
          tickRotate: -30,
          label: null,
        },
        y: {
          label: null,
          nice: true,
          tickFormat: (d) => d.toLocaleString(),
        },
        marks: [
          Plot.gridY(),
          Plot.barY(
            data(),
            {
              x: 'category',
              y: 'frequency',
              fill: 'color',
              channels: { position: (d) => d.position },
              // eslint-disable-next-line no-nested-ternary
              sort: props.order === 'ascending'
                ? { x: 'y', order: 'ascending' }
                : props.order === 'descending'
                  ? { x: 'y', reverse: true }
                  : { x: 'position', order: 'ascending' },
            },
          ),
          Plot.ruleY([0]),
        ],
      }) as SVGSVGElement
  }
  </>;
}

export default function legendCategoricalChoroplethBarchart(
  legend: CategoricalChoroplethBarchartLegend,
): JSX.Element {
  const { LL } = useI18nContext();
  let refElement: SVGGElement;

  const layer = findLayerById(
    layersDescriptionStore.layers,
    legend.layerId,
  )!;

  function getCategoricalParameters(layerDescription: LayerDescription) {
    if (layerDescription.representationType === 'categoricalChoropleth') {
      return layerDescription.rendererParameters as CategoricalChoroplethParameters;
    }
    if (
      layerDescription.representationType === 'proportionalSymbols'
      && (layerDescription as LayerDescriptionProportionalSymbols).rendererParameters.colorMode === 'categoricalVariable'
    ) {
      return (layerDescription.rendererParameters as ProportionalSymbolCategoryParameters).color;
    }
    throw new Error('Invalid reference layer');
  }

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
    bindElementsLegend(refElement, legend);
  });

  // Recompute the size of the rectangle box when the legend is updated
  createEffect(
    on(
      () => [
        heightTitle(), heightSubtitle(),
        legend.height, legend.width,
        legend.title.text, legend.subtitle.text, legend.note.text,
      ],
      () => {
        computeRectangleBox(refElement);
      },
    ),
  );

  return <g
    ref={refElement!}
    id={legend.id}
    class="legend categorical-choropleth-barchart"
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
      transform={`translate(0, ${heightTitle() + heightSubtitle() - defaultSpacing * 2})`}
    >
      <CategoriesPlot
        mapping={getCategoricalParameters(layer).mapping}
        orientation={legend.orientation}
        order={legend.order}
        textProperties={legend.axis}
        width={legend.width}
        height={legend.height}
      />
    </g>
    {
      makeLegendText(
        legend.note,
        [legend.width / 2, heightTitle() + heightSubtitle() + legend.height - defaultSpacing * 2],
        'note',
        { 'text-anchor': 'middle' },
      )
    }
  </g>;
}
