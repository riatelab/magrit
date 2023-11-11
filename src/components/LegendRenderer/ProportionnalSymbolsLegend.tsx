// Imports from solid-js
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
import { PropSizer } from '../../helpers/geo';
import { round, sum } from '../../helpers/math';

// Sub-components
import {
  makeLegendText,
  makeRectangleBox,
  makeLegendSettingsModal,
  triggerContextMenuLegend, computeRectangleBox, bindMouseEnterLeave, bindDragBehavior, getTextSize,
} from './common.tsx';

// Stores
import { applicationSettingsStore, RenderVisibility } from '../../store/ApplicationSettingsStore';

// Types / Interfaces / Enums
import type {
  LayerDescription,
  LayerDescriptionProportionalSymbols,
  ProportionalSymbolsLegendParameters,
  ProportionalSymbolsParameters,
} from '../../global.d';

const defaultSpacing = 5;

const bindElementsLegend = (refElement: SVGGElement, layer: LayerDescription) => {
  computeRectangleBox(refElement);
  bindMouseEnterLeave(refElement);
  bindDragBehavior(refElement, layer);
};

function stackedSquareLegend(
  layer: LayerDescriptionProportionalSymbols,
): JSX.Element {
  let refElement: SVGGElement;
  const { LL } = useI18nContext();
  const propSize = new (PropSizer as any)(
    layer.rendererParameters.referenceValue,
    layer.rendererParameters.referenceRadius,
    layer.rendererParameters.symbolType,
  );

  const maxHeight = createMemo(
    () => propSize.scale(layer.legend.values[layer.legend.values.length - 1]),
  );

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

  const positionNote = createMemo(() => (
    heightTitleSubtitle()
    + maxHeight()
    + defaultSpacing * 2
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
        layer.legend.title.text,
        layer.legend?.subtitle?.text,
        layer.legend?.note?.text,
        layer.legend.roundDecimals,
      );
    }
  });

  return <g
    ref={refElement}
    class="legend proportionalSymbols"
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
    { makeRectangleBox() }
    { makeLegendText(layer.legend.title, [0, 0], 'title') }
    { makeLegendText(layer.legend?.subtitle, [0, heightTitle()], 'subtitle') }
    { makeLegendText(layer.legend.note, [0, positionNote()], 'note') }
    <g class="legend-content">
      <For each={layer.legend.values.toReversed()}>
        {
          (value) => {
            const symbolSize = propSize.scale(value);
            return <>
              <rect
                fill={layer.rendererParameters.color}
                fill-opacity={layer.fillOpacity}
                stroke={layer.strokeColor}
                stroke-width={layer.strokeWidth}
                width={symbolSize}
                height={symbolSize}
                x={maxHeight() - symbolSize}
                y={ heightTitleSubtitle() - symbolSize + maxHeight()}
              ></rect>
              <text
                font-size={layer.legend.labels.fontSize}
                font-family={layer.legend.labels.fontFamily}
                font-style={layer.legend.labels.fontStyle}
                font-weight={layer.legend.labels.fontWeight}
                fill={layer.legend.labels.fontColor}
                text-anchor="start"
                dominant-baseline="middle"
                style={{ 'user-select': 'none' }}
                x={maxHeight() + defaultSpacing * 2}
                y={ heightTitleSubtitle() + maxHeight() - symbolSize}
              >{ round(value, layer.legend!.roundDecimals).toLocaleString() }</text>
              <line
                stroke-width={0.8}
                stroke-dasharray="2"
                stroke="black"
                x1={maxHeight()}
                y1={ heightTitleSubtitle() + maxHeight() - symbolSize}
                x2={maxHeight() + defaultSpacing * 2}
                y2={ heightTitleSubtitle() + maxHeight() - symbolSize}
              ></line>
            </>;
          }
        }
      </For>
    </g>
  </g>;
}

function horizontalSquareLegend(
  layer: LayerDescriptionProportionalSymbols,
): JSX.Element {
  let refElement: SVGGElement;
  const { LL } = useI18nContext();
  const propSize = new (PropSizer as any)(
    layer.rendererParameters.referenceValue,
    layer.rendererParameters.referenceRadius,
    layer.rendererParameters.symbolType,
  );

  const maxHeight = createMemo(
    () => propSize.scale(layer.legend.values[layer.legend.values.length - 1]),
  );

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

  const positionNote = createMemo(() => (
    heightTitleSubtitle()
    + maxHeight()
    + +(layer.legend.labels.fontSize.replace('px', ''))
    + defaultSpacing * 3
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
        layer.legend.title.text,
        layer.legend?.subtitle?.text,
        layer.legend?.note?.text,
        layer.legend.roundDecimals,
        layer.legend.spacing,
      );
    }
  });
  // Precompute the size and position of the symbols now
  // instead of computing it in the For directive
  // (and use createMemo to make it reactive)
  const sizesAndPositions = createMemo(() => {
    let lastSize = 0;
    return layer.legend.values.toReversed()
      .map((value, i) => {
        const symbolSize = propSize.scale(value);
        const x = lastSize + i * layer.legend.spacing;
        lastSize += symbolSize;
        return {
          size: symbolSize,
          x,
          y: heightTitleSubtitle() - symbolSize + maxHeight(),
          value,
        };
      });
  });

  return <g
    ref={refElement}
    class="legend proportionalSymbols"
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
    { makeRectangleBox() }
    { makeLegendText(layer.legend.title, [0, 0], 'title') }
    { makeLegendText(layer.legend?.subtitle, [0, heightTitle()], 'subtitle') }
    { makeLegendText(layer.legend.note, [0, positionNote()], 'note') }
    <g class="legend-content">
      <For each={sizesAndPositions()}>
        {
          (d) => <>
            <rect
              fill={layer.rendererParameters.color}
              fill-opacity={layer.fillOpacity}
              stroke={layer.strokeColor}
              stroke-width={layer.strokeWidth}
              width={d.size}
              height={d.size}
              x={d.x}
              y={d.y}
            ></rect>
            <text
              font-size={layer.legend.labels.fontSize}
              font-family={layer.legend.labels.fontFamily}
              font-style={layer.legend.labels.fontStyle}
              font-weight={layer.legend.labels.fontWeight}
              fill={layer.legend.labels.fontColor}
              text-anchor="middle"
              dominant-baseline="hanging"
              style={{ 'user-select': 'none' }}
              x={d.x + d.size / 2}
              y={heightTitleSubtitle() + maxHeight() + defaultSpacing * 2}
            >{ round(d.value, layer.legend!.roundDecimals).toLocaleString() }</text>
          </>
        }
      </For>
    </g>
  </g>;
}

function verticalSquareLegend(
  layer: LayerDescriptionProportionalSymbols,
): JSX.Element {
  let refElement: SVGGElement;
  const { LL } = useI18nContext();
  const propSize = new (PropSizer as any)(
    layer.rendererParameters.referenceValue,
    layer.rendererParameters.referenceRadius,
    layer.rendererParameters.symbolType,
  );

  const maxHeight = createMemo(
    () => propSize.scale(layer.legend.values[layer.legend.values.length - 1]),
  );

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

  const positionNote = createMemo(() => (
    heightTitleSubtitle() // The size necessary for the title and subtitle
    + ( // The size for all the symbols and the spacing between them
      sum(layer.legend.values.map((v) => propSize.scale(v) + layer.legend.spacing))
      - layer.legend.spacing
    )
    + defaultSpacing * 2 // Spacing between last symbol and note
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
        layer.legend.title.text,
        layer.legend?.subtitle?.text,
        layer.legend?.note?.text,
        layer.legend.roundDecimals,
      );
    }
  });
  // Precompute the size and position of the symbols now
  // instead of computing it in the For directive
  // (and use createMemo to make it reactive)
  const sizesAndPositions = createMemo(() => {
    let lastSize = 0;
    return layer.legend.values.toReversed()
      .map((value, i) => {
        const symbolSize = propSize.scale(value);
        lastSize += symbolSize;
        return {
          size: symbolSize,
          x: (maxHeight() - symbolSize) / 2,
          y: heightTitleSubtitle() - symbolSize + lastSize + layer.legend.spacing * i,
          value,
        };
      });
  });

  return <g
    ref={refElement}
    class="legend proportionalSymbols"
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
    { makeRectangleBox() }
    { makeLegendText(layer.legend.title, [0, 0], 'title') }
    { makeLegendText(layer.legend?.subtitle, [0, heightTitle()], 'subtitle') }
    { makeLegendText(layer.legend.note, [0, positionNote()], 'note') }
    <g class="legend-content">
      <For each={sizesAndPositions()}>
        {
          (d) => <>
              <rect
                fill={layer.rendererParameters.color}
                fill-opacity={layer.fillOpacity}
                stroke={layer.strokeColor}
                stroke-width={layer.strokeWidth}
                width={d.size}
                height={d.size}
                x={d.x}
                y={d.y}
              ></rect>
              <text
                font-size={layer.legend.labels.fontSize}
                font-family={layer.legend.labels.fontFamily}
                font-style={layer.legend.labels.fontStyle}
                font-weight={layer.legend.labels.fontWeight}
                fill={layer.legend.labels.fontColor}
                text-anchor="start"
                dominant-baseline="middle"
                style={{ 'user-select': 'none' }}
                x={ maxHeight() + defaultSpacing * 2 }
                y={ d.y + d.size / 2 }
              >{ round(d.value, layer.legend!.roundDecimals).toLocaleString() }</text>
            </>
        }
      </For>
    </g>
  </g>;
}

function stackedCircleLegend(
  layer: LayerDescriptionProportionalSymbols,
): JSX.Element {
  let refElement: SVGGElement;
  const { LL } = useI18nContext();
  const propSize = new (PropSizer as any)(
    layer.rendererParameters.referenceValue,
    layer.rendererParameters.referenceRadius,
    layer.rendererParameters.symbolType,
  );

  const maxRadius = createMemo(
    () => propSize.scale(layer.legend.values[layer.legend.values.length - 1]),
  );

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

  const positionNote = createMemo(() => (
    heightTitleSubtitle()
    + maxRadius() * 2
    + defaultSpacing * 2
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
        layer.legend.title.text,
        layer.legend?.subtitle?.text,
        layer.legend?.note?.text,
        layer.legend.roundDecimals,
      );
    }
  });

  return <g
    ref={refElement}
    class="legend proportionalSymbols"
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
    { makeRectangleBox() }
    { makeLegendText(layer.legend.title, [0, 0], 'title') }
    { makeLegendText(layer.legend?.subtitle, [0, heightTitle()], 'subtitle') }
    { makeLegendText(layer.legend.note, [0, positionNote()], 'note') }
    <g class="legend-content">
      <For each={layer.legend.values.toReversed()}>
        {
          (value) => {
            const symbolSize = propSize.scale(value);
            return <>
              <circle
                fill={layer.rendererParameters.color}
                fill-opacity={layer.fillOpacity}
                stroke={layer.strokeColor}
                stroke-width={layer.strokeWidth}
                r={symbolSize}
                cx={maxRadius()}
                cy={ heightTitleSubtitle() - symbolSize + maxRadius() * 2 }
              ></circle>
              <text
                font-size={layer.legend.labels.fontSize}
                font-family={layer.legend.labels.fontFamily}
                font-style={layer.legend.labels.fontStyle}
                font-weight={layer.legend.labels.fontWeight}
                fill={layer.legend.labels.fontColor}
                text-anchor="start"
                dominant-baseline="middle"
                style={{ 'user-select': 'none' }}
                x={maxRadius() * 2 + defaultSpacing * 2}
                y={ heightTitleSubtitle() + maxRadius() * 2 - symbolSize * 2 }
              >{ round(value, layer.legend!.roundDecimals).toLocaleString() }</text>
              <line
                stroke-width={0.8}
                stroke-dasharray="2"
                stroke="black"
                x1={maxRadius()}
                y1={ heightTitleSubtitle() + maxRadius() * 2 - symbolSize * 2 }
                x2={maxRadius() * 2 + defaultSpacing * 2}
                y2={ heightTitleSubtitle() + maxRadius() * 2 - symbolSize * 2 }
              ></line>
            </>;
          }
        }
      </For>
    </g>
  </g>;
}

function verticalCircleLegend(
  layer: LayerDescriptionProportionalSymbols,
): JSX.Element {
  let refElement: SVGGElement;
  const { LL } = useI18nContext();

  const propSize = new (PropSizer as any)(
    layer.rendererParameters.referenceValue,
    layer.rendererParameters.referenceRadius,
    layer.rendererParameters.symbolType,
  );

  const maxRadius = createMemo(
    () => propSize.scale(layer.legend.values[layer.legend.values.length - 1]),
  );

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

  onMount(() => {
    bindElementsLegend(refElement, layer);
  });

  // Precompute the size and position of the symbols now
  // instead of computing it in the For directive
  // (and use createMemo to make it reactive)
  const sizesAndPositions = createMemo(() => {
    let lastPosition = heightTitleSubtitle();
    return layer.legend.values.toReversed()
      .map((value) => {
        const symbolSize = propSize.scale(value);
        const cy = symbolSize + lastPosition;
        lastPosition = cy + symbolSize + layer.legend.spacing;
        return {
          size: symbolSize,
          x: maxRadius(),
          y: cy,
          value,
        };
      });
  });

  return <g
    ref={refElement}
    class="legend proportionalSymbols"
    transform={`translate(${layer.legend?.position[0]}, ${layer.legend?.position[1]})`}
    visibility={layer.visible && layer.legend.visible ? undefined : 'hidden'}
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLegend(e, layer.id, LL);
    }}
    onDblClick={() => { makeLegendSettingsModal(layer.id, LL); }}
  >
    { makeRectangleBox() }
    { makeLegendText(layer.legend.title, [0, 0], 'title') }
    { makeLegendText(layer.legend?.subtitle, [0, heightTitle()], 'subtitle') }
    <g class="legend-content">
      <For each={sizesAndPositions()}>
        {
          (d) => <>
            <circle
              fill={layer.rendererParameters.color}
              fill-opacity={layer.fillOpacity}
              stroke={layer.strokeColor}
              stroke-width={layer.strokeWidth}
              r={d.size}
              cx={d.x}
              cy={d.y}
            ></circle>
            <text
              font-size={layer.legend.labels.fontSize}
              font-family={layer.legend.labels.fontFamily}
              font-style={layer.legend.labels.fontStyle}
              font-weight={layer.legend.labels.fontWeight}
              fill={layer.legend.labels.fontColor}
              text-anchor="start"
              dominant-baseline="middle"
              style={{ 'user-select': 'none' }}
              x={d.x * 2 + defaultSpacing}
              y={d.y}
            >{ round(d.value, layer.legend!.roundDecimals).toLocaleString() }</text>
          </>
        }
      </For>
    </g>
    {
      makeLegendText(
        layer.legend.note,
        [0, sizesAndPositions()[sizesAndPositions().length - 1].y + defaultSpacing * 3],
        'note',
      )
    }
  </g>;
}

function horizontalCircleLegend(
  layer: LayerDescriptionProportionalSymbols,
): JSX.Element {
  let refElement: SVGGElement;
  const { LL } = useI18nContext();

  const propSize = new (PropSizer as any)(
    layer.rendererParameters.referenceValue,
    layer.rendererParameters.referenceRadius,
    layer.rendererParameters.symbolType,
  );

  const maxRadius = createMemo(
    () => propSize.scale(layer.legend.values[layer.legend.values.length - 1]),
  );

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

  const positionNote = createMemo(() => (
    maxRadius() * 2 + heightTitleSubtitle() + defaultSpacing * 3 + +(layer.legend.labels.fontSize.replace('px', ''))
  ));

  onMount(() => {
    bindElementsLegend(refElement, layer);
  });

  const sizesAndPositions = createMemo(() => {
    let lastSize = 0;
    return layer.legend.values.toReversed()
      .map((value, i) => {
        const symbolSize = propSize.scale(value);
        const x = maxRadius() + lastSize * 2 + layer.legend.spacing * i;
        lastSize += symbolSize;
        return {
          size: symbolSize,
          x,
          y: maxRadius() + heightTitleSubtitle() + (maxRadius() - symbolSize),
          value,
        };
      });
  });

  return <g
    ref={refElement}
    class="legend proportionalSymbols"
    transform={`translate(${layer.legend?.position[0]}, ${layer.legend?.position[1]})`}
    visibility={layer.visible && layer.legend.visible ? undefined : 'hidden'}
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLegend(e, layer.id, LL);
    }}
    onDblClick={() => { makeLegendSettingsModal(layer.id, LL); }}
  >
    { makeRectangleBox() }
    { makeLegendText(layer.legend.title, [0, 0], 'title') }
    { makeLegendText(layer.legend?.subtitle, [0, heightTitle()], 'subtitle') }
    <g class="legend-content">
      <For each={sizesAndPositions()}>
        {
          (d) => <>
            <circle
              fill={layer.rendererParameters.color}
              fill-opacity={layer.fillOpacity}
              stroke={layer.strokeColor}
              stroke-width={layer.strokeWidth}
              r={d.size}
              cx={d.x}
              cy={d.y}
            ></circle>
            <text
              font-size={layer.legend.labels.fontSize}
              font-family={layer.legend.labels.fontFamily}
              font-style={layer.legend.labels.fontStyle}
              font-weight={layer.legend.labels.fontWeight}
              fill={layer.legend.labels.fontColor}
              text-anchor="middle"
              dominant-baseline="hanging"
              style={{ 'user-select': 'none' }}
              x={d.x}
              y={maxRadius() * 2 + heightTitleSubtitle() + defaultSpacing * 2}
            >{ round(d.value, layer.legend!.roundDecimals).toLocaleString() }</text>
          </>
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

export default function legendProportionalSymbols(
  layer: LayerDescriptionProportionalSymbols,
): JSX.Element {
  return <Show when={
    applicationSettingsStore.renderVisibility === RenderVisibility.RenderAsHidden
    || (layer.visible && (layer.legend as ProportionalSymbolsLegendParameters).visible)
  }>
    {
      (layer.rendererParameters as ProportionalSymbolsParameters).symbolType === 'circle'
        ? ({
          stacked: stackedCircleLegend,
          vertical: verticalCircleLegend,
          horizontal: horizontalCircleLegend,
        })[(layer.legend as ProportionalSymbolsLegendParameters).layout](layer)
        : ({
          stacked: stackedSquareLegend,
          vertical: verticalSquareLegend,
          horizontal: horizontalSquareLegend,
        })[(layer.legend as ProportionalSymbolsLegendParameters).layout](layer)
    }
  </Show>;
}
