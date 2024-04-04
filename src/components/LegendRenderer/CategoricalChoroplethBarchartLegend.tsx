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
  Orientation,
  type ProportionalSymbolCategoryParameters,
} from '../../global.d';

const defaultSpacing = applicationSettingsStore.defaultLegendSettings.spacing;

function makeSortOptions(
  orientation: Orientation,
  order: 'ascending' | 'descending' | 'none',
) {
  const axisLetter = orientation === 'vertical' ? 'y' : 'x';
  const axisLetterOpposite = orientation === 'vertical' ? 'x' : 'y';

  if (order === 'ascending') {
    // We want bars to be sorted by frequency in ascending order
    return {
      [axisLetter]: axisLetterOpposite,
      order: 'ascending',
    };
  }
  if (order === 'descending') {
    // We want bars to be sorted by frequency in ascending order
    return {
      [axisLetter]: axisLetterOpposite,
      order: 'descending',
    };
  }

  // Otherwise want bars to be sorted in the order they were provided
  return {
    [axisLetter]: 'position',
    order: 'ascending',
  };
}

function CategoriesPlot(
  props: {
    mapping: CategoricalChoroplethMapping[],
    orientation: Orientation,
    order: 'ascending' | 'descending' | 'none',
    color: string,
    height: number,
    width: number,
  },
): JSX.Element {
  const domain = createMemo(() => props.mapping.map((m) => m.categoryName));
  const range = createMemo(() => props.mapping.map((m) => m.color));
  const data = createMemo(() => props.mapping.map((m, i) => ({
    position: i,
    category: m.categoryName,
    color: m.color,
    frequency: m.count,
  })));
  const sizeLargestLabel = createMemo(() => Math.max(
    ...props.mapping.map((m) => getTextSize(
      m.categoryName || '',
      10,
      'sans-serif',
    ).width),
  ));

  return <>
  {
    props.orientation === 'vertical'
      ? Plot.plot({
        style: { color: props.color },
        height: props.height,
        width: props.width,
        marginTop: 10,
        marginLeft: sizeLargestLabel() + 10,
        color: { domain: domain(), range: range() },
        x: { label: null },
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
              sort: makeSortOptions(props.orientation, props.order),
            },
          ),
          Plot.ruleX([0]),
        ],
      }) as SVGSVGElement
      : Plot.plot({
        height: props.height,
        width: props.width,
        style: { color: props.color },
        marginTop: 10,
        marginBottom: Math.max(sizeLargestLabel() * 0.6, 25),
        marginLeft: 30,
        color: { domain: domain(), range: range() },
        x: {
          type: 'band',
          tickRotate: -30,
          label: null,
        },
        y: { label: null, nice: true },
        marks: [
          Plot.gridY(),
          Plot.barY(
            data(),
            {
              x: 'category',
              y: 'frequency',
              fill: 'color',
              channels: { position: (d) => d.position },
              sort: makeSortOptions(props.orientation, props.order),
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
    if (layerDescription.renderer === 'categoricalChoropleth') {
      return layerDescription.rendererParameters as CategoricalChoroplethParameters;
    }
    if (
      layerDescription.renderer === 'proportionalSymbols'
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
    {makeLegendText(legend.title, [0, 0], 'title')}
    {makeLegendText(legend.subtitle, [0, heightTitle()], 'subtitle')}
    <g
      transform={`translate(0, ${heightTitle() + heightSubtitle()})`}
    >
      <CategoriesPlot
        mapping={getCategoricalParameters(layer).mapping}
        orientation={legend.orientation}
        order={legend.order}
        color={legend.fontColor}
        width={legend.width}
        height={legend.height}
      />
    </g>
    {
      makeLegendText(
        legend.note,
        [0, heightTitle() + heightSubtitle() + legend.height],
        'note',
      )
    }
  </g>;
}
