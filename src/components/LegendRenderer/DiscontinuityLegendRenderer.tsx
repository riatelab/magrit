import {
  createEffect,
  createMemo,
  For,
  type JSX,
  onMount,
  Show,
} from 'solid-js';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { round } from '../../helpers/math';

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

// Stores
import { applicationSettingsStore, RenderVisibility } from '../../store/ApplicationSettingsStore';
import type { DiscontinuityLegendParameters, LayerDescriptionDiscontinuity } from '../../global';

const defaultSpacing = applicationSettingsStore.defaultLegendSettings.spacing;

function verticalDiscontinuityLegend(
  layer: LayerDescriptionDiscontinuity,
): JSX.Element {
  const { LL } = useI18nContext();
  let refElement: SVGGElement;

  const heightTitle = createMemo(
    () => getTextSize(
      layer.legend.title.text,
      layer.legend.title.fontSize,
      layer.legend.title.fontFamily,
    ).height + defaultSpacing,
  );

  const heightTitleSubtitle = createMemo(() => {
    if (!layer.legend?.subtitle || !layer.legend?.subtitle.text) {
      return heightTitle();
    }
    return heightTitle() + getTextSize(
      layer.legend.subtitle.text,
      layer.legend.subtitle.fontSize,
      layer.legend.subtitle.fontFamily,
    ).height + defaultSpacing;
  });

  const distanceToTop = createMemo(
    () => heightTitleSubtitle() + getTextSize(
      '1234567890',
      layer.legend.labels.fontSize,
      layer.legend.labels.fontFamily,
    ).height / 2 + defaultSpacing,
  );

  const sizesAndPositions = createMemo(() => {
    let lastSize = 0;
    return layer.rendererParameters.sizes.toReversed()
      .map((size) => {
        const result = {
          size,
          x: 0,
          y: distanceToTop() + lastSize + defaultSpacing,
        };
        lastSize += size + defaultSpacing;
        return result;
      });
  });

  const positionsLabel = createMemo(() => {
    const reversedBreaks = layer.rendererParameters.breaks.toReversed();
    const tmp = sizesAndPositions()
      .map((s, i) => ({
        y: s.y - s.size - defaultSpacing,
        breakValue: reversedBreaks[i],
      }));
    tmp.push({
      y: (sizesAndPositions()[sizesAndPositions().length - 1].y
        + sizesAndPositions()[sizesAndPositions().length - 1].size + defaultSpacing),
      breakValue: reversedBreaks[reversedBreaks.length - 1],
    });
    return tmp;
  });

  const positionNote = createMemo(() => (
    positionsLabel()[positionsLabel().length - 1].y
    + getTextSize(
      layer.legend.note.text,
      layer.legend.note.fontSize,
      layer.legend.note.fontFamily,
    ).height + defaultSpacing
  ));

  onMount(() => {
    bindElementsLegend(refElement, layer);
  });

  createEffect(() => {
    if (refElement && layer.visible && layer.legend?.visible) {
      computeRectangleBox(
        refElement,
        heightTitle(),
        heightTitleSubtitle(),
        positionNote(),
        positionsLabel(),
        sizesAndPositions(),
        layer.legend.title.text,
        layer.legend.subtitle?.text,
        layer.legend.note?.text,
        layer.legend.roundDecimals,
        layer.legend.lineLength,
      );
    }
  });

  return <g
    ref={refElement}
    class="legend discontinuity"
    for={layer.id}
    transform={`translate(${layer.legend?.position[0]}, ${layer.legend?.position[1]})`}
    visibility={layer.visible && layer.legend.visible ? undefined : 'hidden'}
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLegend(e, layer.id, LL);
    }}
    onDblClick={() => { makeLegendSettingsModal(layer.id, LL); }}
    style={{ cursor: 'grab' }}
  >
    <RectangleBox backgroundRect={layer.legend.backgroundRect} />
    { makeLegendText(layer.legend.title, [0, 0], 'title') }
    { makeLegendText(layer.legend?.subtitle, [0, heightTitle()], 'subtitle') }
    <g class="legend-content">
      <For each={sizesAndPositions()}>
        {
          ({ size, y }) => <line
            x1={0}
            x2={layer.legend.lineLength}
            y1={y}
            y2={y}
            stroke={layer.strokeColor}
            stroke-width={size}
          >
          </line>
        }
      </For>
      <For each={positionsLabel()}>
        {
          ({ y, breakValue }) => <text
            x={layer.legend.lineLength + defaultSpacing}
            y={y}
            font-size={layer.legend.labels.fontSize}
            font-family={layer.legend.labels.fontFamily}
            font-style={layer.legend.labels.fontStyle}
            font-weight={layer.legend.labels.fontWeight}
            style={{ 'user-select': 'none' }}
            text-anchor="start"
            dominant-baseline="hanging"
          >{ round(breakValue, layer.legend.roundDecimals).toLocaleString() }</text>
        }
      </For>
    </g>
    {
      makeLegendText(
        layer.legend.note,
        [0, positionNote()],
        'note',
      )
    }
  </g>;
}

function horizontalDiscontinuityLegend(
  layer: LayerDescriptionDiscontinuity,
): JSX.Element {
  const { LL } = useI18nContext();
  let refElement: SVGGElement;

  const heightTitle = createMemo(
    () => getTextSize(
      layer.legend.title.text,
      layer.legend.title.fontSize,
      layer.legend.title.fontFamily,
    ).height + defaultSpacing,
  );

  const heightTitleSubtitle = createMemo(() => {
    if (!layer.legend?.subtitle || !layer.legend?.subtitle.text) {
      return heightTitle();
    }
    return heightTitle() + getTextSize(
      layer.legend.subtitle.text,
      layer.legend.subtitle.fontSize,
      layer.legend.subtitle.fontFamily,
    ).height + defaultSpacing;
  });

  const maxSize = createMemo(
    () => layer.rendererParameters.sizes[layer.rendererParameters.sizes.length - 1],
  );

  const distanceLabelsToTop = createMemo(() => heightTitleSubtitle()
    + maxSize()
    + defaultSpacing);

  const positionNote = createMemo(() => (
    distanceLabelsToTop() + defaultSpacing + layer.legend.labels.fontSize
  ));

  onMount(() => {
    bindElementsLegend(refElement, layer);
  });

  createEffect(() => {
    if (refElement && layer.visible && layer.legend?.visible) {
      computeRectangleBox(
        refElement,
        heightTitle(),
        heightTitleSubtitle(),
        positionNote(),
        maxSize(),
        layer.legend.title.text,
        layer.legend.subtitle?.text,
        layer.legend.note?.text,
        layer.legend.roundDecimals,
        layer.legend.lineLength,
      );
    }
  });

  return <g
    ref={refElement}
    class="legend discontinuity"
    for={layer.id}
    transform={`translate(${layer.legend?.position[0]}, ${layer.legend?.position[1]})`}
    visibility={layer.visible && layer.legend.visible ? undefined : 'hidden'}
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLegend(e, layer.id, LL);
    }}
    onDblClick={() => { makeLegendSettingsModal(layer.id, LL); }}
    style={{ cursor: 'grab' }}
  >
    <RectangleBox backgroundRect={layer.legend.backgroundRect} />
    { makeLegendText(layer.legend.title, [0, 0], 'title') }
    { makeLegendText(layer.legend?.subtitle, [0, heightTitle()], 'subtitle') }
    <g class="legend-content">
      <For each={layer.rendererParameters.sizes}>
        {
          (size, i) => <line
            x1={i() * layer.legend.lineLength}
            x2={(i() + 1) * layer.legend.lineLength}
            y1={heightTitleSubtitle() + defaultSpacing}
            y2={heightTitleSubtitle() + defaultSpacing}
            stroke={layer.strokeColor}
            stroke-width={size}
          >
          </line>
        }
      </For>
      <For each={layer.rendererParameters.breaks}>
        {
          (breakValue, i) => <text
            x={i() * layer.legend.lineLength}
            y={distanceLabelsToTop()}
            font-size={layer.legend.labels.fontSize}
            font-family={layer.legend.labels.fontFamily}
            font-style={layer.legend.labels.fontStyle}
            font-weight={layer.legend.labels.fontWeight}
            style={{ 'user-select': 'none' }}
            text-anchor="middle"
            dominant-baseline="hanging"
          >{ round(breakValue, layer.legend.roundDecimals).toLocaleString() }</text>
        }
      </For>
    </g>
    {
      makeLegendText(
        layer.legend.note,
        [0, positionNote()],
        'note',
      )
    }
  </g>;
}
export default function legendDiscontinuity(
  layer: LayerDescriptionDiscontinuity,
): JSX.Element {
  return <Show when={
    applicationSettingsStore.renderVisibility === RenderVisibility.RenderAsHidden
    || (layer.visible && (layer.legend as DiscontinuityLegendParameters).visible)
  }>
    {
      ({
        vertical: verticalDiscontinuityLegend,
        horizontal: horizontalDiscontinuityLegend,
      })[layer.legend.orientation](layer)
    }
  </Show>;
}
