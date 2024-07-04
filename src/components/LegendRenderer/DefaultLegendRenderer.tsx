// Import from solid-js
import {
  createEffect, createMemo,
  JSX, onMount,
} from 'solid-js';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { findLayerById } from '../../helpers/layers';
import { getSymbolPath } from '../../helpers/svg';

// Stores
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';
import { layersDescriptionStore } from '../../store/LayersDescriptionStore';

// Sub-components and helpers for legend rendering
import {
  bindElementsLegend,
  computeRectangleBox,
  getTextSize,
  makeLegendSettingsModal,
  makeLegendText,
  RectangleBox,
  triggerContextMenuLegend,
} from './common.tsx';

// Import some type descriptions
import { type DefaultLegend } from '../../global.d';

const defaultSpacing = applicationSettingsStore.defaultLegendSettings.spacing;

function pointLegend(
  legend: DefaultLegend,
): JSX.Element {
  let refElement: SVGGElement;
  const { LL } = useI18nContext();
  const layer = findLayerById(
    layersDescriptionStore.layers,
    legend.layerId,
  )!;

  const heightTitle = createMemo(
    () => getTextSize(
      legend.title.text,
      legend.title.fontSize,
      legend.title.fontFamily,
    ).height + applicationSettingsStore.defaultLegendSettings.spacing,
  );

  const heightTitleSubtitle = createMemo(() => {
    if (!legend.subtitle || !legend.subtitle.text) {
      return heightTitle();
    }
    return heightTitle() + getTextSize(
      legend.subtitle.text,
      legend.subtitle.fontSize,
      legend.subtitle.fontFamily,
    ).height + defaultSpacing;
  });

  const sizeDisplayedEntry = layer.symbolSize!;

  const positionNote = createMemo(() => (
    sizeDisplayedEntry
    + heightTitleSubtitle()
    + defaultSpacing * 2
  ));

  onMount(() => {
    bindElementsLegend(refElement, legend);
  });

  createEffect(() => {
    computeRectangleBox(
      refElement,
      heightTitle(),
      heightTitleSubtitle(),
      positionNote(),
      legend.title.text,
      legend.subtitle.text,
      legend.note.text,
    );
  });

  return <g
    ref={refElement!}
    id={legend.id}
    class="legend default"
    for={layer.id}
    transform={`translate(${legend.position[0]}, ${legend.position[1]})`}
    visibility={layer.visible && legend.visible ? undefined : 'hidden'}
    onDblClick={() => { makeLegendSettingsModal(legend.id, LL); }}
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLegend(e, legend.id, LL);
    } }
    style={{ cursor: 'grab' }}
  >
    <RectangleBox backgroundRect={legend.backgroundRect} />
    { makeLegendText(legend.title, [0, 0], 'title') }
    { makeLegendText(legend.subtitle, [0, heightTitle()], 'subtitle') }
    <g class="legend-content">
      <path
        d={
          getSymbolPath(
            layer.symbolType!,
            [0, heightTitleSubtitle() + sizeDisplayedEntry / 2],
            layer.symbolSize!,
          )
        }
        fill={layer.fillColor}
        fill-opacity={layer.fillOpacity}
        stroke={layer.strokeColor}
        vector-effect="non-scaling-stroke"
      />
      <text
        x={sizeDisplayedEntry / 2 + defaultSpacing}
        y={heightTitleSubtitle() + sizeDisplayedEntry / 2}
        font-size={legend.labels.fontSize}
        font-family={legend.labels.fontFamily}
        font-style={legend.labels.fontStyle}
        font-weight={legend.labels.fontWeight}
        fill={legend.labels.fontColor}
        text-anchor="start"
        dominant-baseline="middle"
      >{legend.labels.text}</text>
    </g>
    { makeLegendText(legend.note, [0, positionNote()], 'note') }
  </g>;
}

function lineLegend(
  legend: DefaultLegend,
): JSX.Element {
  let refElement: SVGGElement;
  const { LL } = useI18nContext();
  const layer = findLayerById(
    layersDescriptionStore.layers,
    legend.layerId,
  )!;

  const heightTitle = createMemo(
    () => getTextSize(
      legend.title.text,
      legend.title.fontSize,
      legend.title.fontFamily,
    ).height + applicationSettingsStore.defaultLegendSettings.spacing,
  );

  const heightTitleSubtitle = createMemo(() => {
    if (!legend.subtitle || !legend.subtitle.text) {
      return heightTitle();
    }
    return heightTitle() + getTextSize(
      legend.subtitle.text,
      legend.subtitle.fontSize,
      legend.subtitle.fontFamily,
    ).height + defaultSpacing;
  });

  const positionNote = createMemo(() => (
    layer.strokeWidth
    + heightTitleSubtitle()
    + defaultSpacing * 2
  ));

  onMount(() => {
    bindElementsLegend(refElement, legend);
  });

  createEffect(() => {
    computeRectangleBox(
      refElement,
      heightTitle(),
      heightTitleSubtitle(),
      positionNote(),
      legend.title.text,
      legend.subtitle.text,
      legend.note.text,
    );
  });

  return <g
    ref={refElement!}
    id={legend.id}
    class="legend default"
    for={layer.id}
    transform={`translate(${legend.position[0]}, ${legend.position[1]})`}
    visibility={layer.visible && legend.visible ? undefined : 'hidden'}
    onDblClick={() => { makeLegendSettingsModal(legend.id, LL); }}
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLegend(e, legend.id, LL);
    } }
    style={{ cursor: 'grab' }}
  >
    <RectangleBox backgroundRect={legend.backgroundRect} />
    { makeLegendText(legend.title, [0, 0], 'title') }
    { makeLegendText(legend.subtitle, [0, heightTitle()], 'subtitle') }
    <g class="legend-content">
      <rect
        fill={layer.strokeColor}
        fill-opacity={layer.strokeOpacity}
        stroke-width={0}
        x={0}
        y={heightTitleSubtitle()}
        rx={legend.boxCornerRadius}
        ry={legend.boxCornerRadius}
        width={legend.boxWidth}
        height={layer.strokeWidth}
      ></rect>
      <text
        x={legend.boxWidth + defaultSpacing}
        y={heightTitleSubtitle() + layer.strokeWidth! / 2}
        font-size={legend.labels.fontSize}
        font-family={legend.labels.fontFamily}
        font-style={legend.labels.fontStyle}
        font-weight={legend.labels.fontWeight}
        fill={legend.labels.fontColor}
        text-anchor="start"
        dominant-baseline="middle"
      >{legend.labels.text}</text>
    </g>
    { makeLegendText(legend.note, [0, positionNote()], 'note') }
  </g>;
}

function rectangleLegend(
  legend: DefaultLegend,
): JSX.Element {
  let refElement: SVGGElement;
  const { LL } = useI18nContext();
  const layer = findLayerById(
    layersDescriptionStore.layers,
    legend.layerId,
  )!;

  const heightTitle = createMemo(
    () => getTextSize(
      legend.title.text,
      legend.title.fontSize,
      legend.title.fontFamily,
    ).height + applicationSettingsStore.defaultLegendSettings.spacing,
  );

  const heightTitleSubtitle = createMemo(() => {
    if (!legend.subtitle || !legend.subtitle.text) {
      return heightTitle();
    }
    return heightTitle() + getTextSize(
      legend.subtitle.text,
      legend.subtitle.fontSize,
      legend.subtitle.fontFamily,
    ).height + defaultSpacing;
  });

  const sizeDisplayedEntry = legend.boxHeight;

  const positionNote = createMemo(() => (
    sizeDisplayedEntry
    + heightTitleSubtitle()
    + defaultSpacing * 2
  ));

  onMount(() => {
    bindElementsLegend(refElement, legend);
  });

  createEffect(() => {
    computeRectangleBox(
      refElement,
      heightTitle(),
      heightTitleSubtitle(),
      positionNote(),
      legend.title.text,
      legend.subtitle.text,
      legend.note.text,
    );
  });

  return <g
    ref={refElement!}
    id={legend.id}
    class="legend default"
    for={layer.id}
    transform={`translate(${legend.position[0]}, ${legend.position[1]})`}
    visibility={layer.visible && legend.visible ? undefined : 'hidden'}
    onDblClick={() => { makeLegendSettingsModal(legend.id, LL); }}
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLegend(e, legend.id, LL);
    } }
    style={{ cursor: 'grab' }}
  >
    <RectangleBox backgroundRect={legend.backgroundRect} />
    { makeLegendText(legend.title, [0, 0], 'title') }
    { makeLegendText(legend.subtitle, [0, heightTitle()], 'subtitle') }
    <g class="legend-content">
      <rect
        fill={layer.fillColor}
        fill-opacity={layer.fillOpacity}
        stroke={layer.strokeColor}
        x={0}
        y={heightTitleSubtitle()}
        rx={legend.boxCornerRadius}
        ry={legend.boxCornerRadius}
        width={legend.boxWidth}
        height={legend.boxHeight}
      ></rect>
      <text
        x={legend.boxWidth + defaultSpacing}
        y={heightTitleSubtitle() + sizeDisplayedEntry / 2}
        font-size={legend.labels.fontSize}
        font-family={legend.labels.fontFamily}
        font-style={legend.labels.fontStyle}
        font-weight={legend.labels.fontWeight}
        fill={legend.labels.fontColor}
        text-anchor="start"
        dominant-baseline="middle"
      >{legend.labels.text}</text>
    </g>
    { makeLegendText(legend.note, [0, positionNote()], 'note') }
  </g>;
}

export default function legendDefault(
  legend: DefaultLegend,
): JSX.Element {
  if (legend.displayAsPolygon || legend.typeGeometry === 'polygon') {
    return rectangleLegend(legend);
  }
  if (legend.typeGeometry === 'linestring') {
    return lineLegend(legend);
  }
  return pointLegend(legend);
}
