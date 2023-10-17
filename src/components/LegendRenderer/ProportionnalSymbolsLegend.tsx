// Imports from solid-js
import {
  createEffect,
  createMemo,
  For,
  type JSX,
  onMount,
  Show,
} from 'solid-js';

// Imports from other packages
import { getColors } from 'dicopal';

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
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';

// Types / Interfaces / Enums
import { type LayerDescription, RenderVisibility } from '../../global.d';

const defaultSpacing = 5;

function proportionalSymbolsStackedLegend(layer: LayerDescription): JSX.Element {
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
      return heightTitle() + defaultSpacing;
    }
    return heightTitle() + defaultSpacing + getTextSize(
      layer.legend.subtitle.text,
      layer.legend.subtitle.fontSize,
      layer.legend.subtitle.fontFamily,
    ).height + defaultSpacing;
  });

  const positionNote = createMemo(() => (
    heightTitleSubtitle()
    + maxRadius() * 2
    + +(layer.legend.note.fontSize.replace('px', ''))
    + defaultSpacing
  ));
  const bindElementsLegend = () => {
    computeRectangleBox(refElement);
    bindMouseEnterLeave(refElement);
    bindDragBehavior(refElement, layer);
  };

  onMount(() => {
    bindElementsLegend();
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

  return <Show when={
    applicationSettingsStore.renderVisibility === RenderVisibility.RenderAsHidden
    || (layer.visible && layer.legend.visible)
  }>
    <g
      ref={refElement}
      class="legend proportionalSymbols"
      transform={`translate(${layer.legend?.position[0]}, ${layer.legend?.position[1]})`}
      visibility={layer.visible && layer.legend.visible ? undefined : 'hidden'}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        triggerContextMenuLegend(e, layer.id, LL);
      }}
      onDblClick={(e) => { makeLegendSettingsModal(layer.id, LL); }}
      style={{ cursor: 'grab' }}
    >
      { makeRectangleBox() }
      { makeLegendText(layer.legend.title, [0, 0], 'title') }
      { makeLegendText(layer.legend?.subtitle, [0, heightTitle()], 'subtitle') }
      { makeLegendText(layer.legend.note, [0, positionNote()], 'note') }
      <g class="legend-content">
        <For each={layer.legend.values}>
          {
            (value) => {
              const symbolSize = propSize.scale(value);
              return <>
                <circle
                  fill="transparent"
                  stroke="black"
                  stroke-width={1}
                  r={symbolSize}
                  cx={maxRadius()}
                  cy={ heightTitleSubtitle() - symbolSize + maxRadius() * 2 }
                ></circle>
                <text
                  font-size={layer.legend.labels.fontSize}
                  font-family={layer.legend.labels.fontFamily}
                  font-color={layer.legend.labels.fontColor}
                  font-style={layer.legend.labels.fontStyle}
                  font-weight={layer.legend.labels.fontWeight}
                  fill={layer.legend.labels.fontColor}
                  text-anchor="start"
                  dominant-baseline="middle"
                  style={{ 'user-select': 'none' }}
                  x={maxRadius() * 2 + defaultSpacing}
                  y={ heightTitleSubtitle() + maxRadius() * 2 - symbolSize * 2 }
                >{ round(value, layer.legend!.roundDecimals) }</text>
                <line
                  stroke-width={0.8}
                  stroke-dasharray="2"
                  stroke="black"
                  x1={maxRadius()}
                  y1={ heightTitleSubtitle() + maxRadius() * 2 - symbolSize * 2 }
                  x2={maxRadius() * 2 + defaultSpacing}
                  y2={ heightTitleSubtitle() + maxRadius() * 2 - symbolSize * 2 }
                ></line>
              </>;
            }
          }
        </For>
      </g>
    </g>
  </Show>;
}

function proportionalSymbolsVerticalLegend(layer: LayerDescription): JSX.Element {
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
    () => +(layer.legend.title.fontSize.replace('px', '')) + defaultSpacing,
  );

  const heightTitleSubtitle = createMemo(() => {
    if (!layer.legend?.subtitle || !layer.legend?.subtitle.text) {
      return heightTitle() + defaultSpacing;
    }
    return heightTitle() + +(
      layer.legend.subtitle.fontSize.replace('px', '')) + defaultSpacing;
  });

  const positionNote = createMemo(() => (
    heightTitleSubtitle()
    + sum(layer.legend.values.map((v) => propSize.scale(v) * 2 + defaultSpacing * 4))
    + +(layer.legend.note.fontSize.replace('px', ''))
    + defaultSpacing
  ));

  const sizeNote = createMemo(() => +(layer.legend.title.fontSize.replace('px', '')) + defaultSpacing);

  const bindElementsLegend = () => {
    computeRectangleBox(refElement);
    bindMouseEnterLeave(refElement);
    bindDragBehavior(refElement, layer);
  };

  onMount(() => {
    bindElementsLegend();
  });

  let lastPosition = heightTitleSubtitle();
  let lastSize = 0;
  return <Show when={
    applicationSettingsStore.renderVisibility === RenderVisibility.RenderAsHidden
    || (layer.visible && layer.legend.visible)
  }>
    <g
      ref={refElement}
      class="legend proportionalSymbols"
      transform={`translate(${layer.legend?.position[0]}, ${layer.legend?.position[1]})`}
      visibility={layer.visible && layer.legend.visible ? undefined : 'hidden'}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        triggerContextMenuLegend(e, layer.id, LL);
      }}
      onDblClick={(e) => { makeLegendSettingsModal(layer.id, LL); }}
    >
      { makeRectangleBox() }
      { makeLegendText(layer.legend.title, [0, 0], 'title') }
      { makeLegendText(layer.legend?.subtitle, [0, heightTitle()], 'subtitle') }
      <g class="legend-content">
        <For each={layer.legend.values.toReversed()}>
          {
            (value) => {
              const symbolSize = propSize.scale(value);
              const cy = symbolSize + lastSize + lastPosition + defaultSpacing * 2;
              lastPosition = cy;
              lastSize = symbolSize;

              return <>
                <circle
                  fill="transparent"
                  stroke="black"
                  stroke-width={1}
                  r={symbolSize}
                  cx={maxRadius()}
                  cy={ cy }
                ></circle>
                <text
                  font-size={layer.legend.labels.fontSize}
                  font-family={layer.legend.labels.fontFamily}
                  font-color={layer.legend.labels.fontColor}
                  font-style={layer.legend.labels.fontStyle}
                  font-weight={layer.legend.labels.fontWeight}
                  fill={layer.legend.labels.fontColor}
                  text-anchor="start"
                  dominant-baseline="middle"
                  style={{ 'user-select': 'none' }}
                  x={maxRadius() * 2 + defaultSpacing}
                  y={ cy }
                >{ round(value, layer.legend!.roundDecimals) }</text>
              </>;
            }
          }
        </For>
      </g>
      { makeLegendText(layer.legend.note, [0, lastPosition + defaultSpacing + sizeNote()], 'note') }
    </g>
  </Show>;
}

function proportionalSymbolsHorizontalLegend(layer: LayerDescription): JSX.Element {
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
    () => +(layer.legend.title.fontSize.replace('px', '')) + defaultSpacing,
  );

  const heightTitleSubtitle = createMemo(() => {
    if (!layer.legend?.subtitle || !layer.legend?.subtitle.text) {
      return heightTitle() + defaultSpacing;
    }
    return heightTitle() + +(
      layer.legend.subtitle.fontSize.replace('px', '')) + defaultSpacing;
  });

  const positionNote = createMemo(() => (
    heightTitleSubtitle()
    + sum(layer.legend.values.map((v) => propSize.scale(v) * 2 + defaultSpacing * 4))
    + +(layer.legend.note.fontSize.replace('px', ''))
    + defaultSpacing
  ));

  const sizeNote = createMemo(() => +(layer.legend.title.fontSize.replace('px', '')) + defaultSpacing);

  const bindElementsLegend = () => {
    computeRectangleBox(refElement);
    bindMouseEnterLeave(refElement);
    bindDragBehavior(refElement, layer);
  };

  onMount(() => {
    bindElementsLegend();
  });

  createEffect(() => {

  });

  let lastSize = 0;
  return <Show when={
    applicationSettingsStore.renderVisibility === RenderVisibility.RenderAsHidden
    || (layer.visible && layer.legend.visible)
  }>
    <g
      ref={refElement}
      class="legend proportionalSymbols"
      transform={`translate(${layer.legend?.position[0]}, ${layer.legend?.position[1]})`}
      visibility={layer.visible && layer.legend.visible ? undefined : 'hidden'}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        triggerContextMenuLegend(e, layer.id, LL);
      }}
      onDblClick={(e) => { makeLegendSettingsModal(layer.id, LL); }}
    >
      { makeRectangleBox() }
      { makeLegendText(layer.legend.title, [0, 0], 'title') }
      { makeLegendText(layer.legend?.subtitle, [0, heightTitle()], 'subtitle') }
      <g class="legend-content">
        <For each={layer.legend.values.toReversed()}>
          {
            (value) => {
              const symbolSize = propSize.scale(value);
              const cx = maxRadius() + lastSize * 2;
              lastSize += symbolSize;

              return <>
                <circle
                  fill="transparent"
                  stroke="black"
                  stroke-width={1}
                  r={symbolSize}
                  cx={ cx }
                  cy={ maxRadius() + heightTitleSubtitle() + (maxRadius() - symbolSize)}
                ></circle>
                <text
                  font-size={layer.legend.labels.fontSize}
                  font-family={layer.legend.labels.fontFamily}
                  font-color={layer.legend.labels.fontColor}
                  font-style={layer.legend.labels.fontStyle}
                  font-weight={layer.legend.labels.fontWeight}
                  fill={layer.legend.labels.fontColor}
                  text-anchor="middle"
                  alignment-baseline="middle"
                  style={{ 'user-select': 'none' }}
                  x={ cx }
                  y={ maxRadius() * 2 + heightTitleSubtitle() + defaultSpacing * 2}
                >{ round(value, layer.legend!.roundDecimals) }</text>
              </>;
            }
          }
        </For>
      </g>
      {
        makeLegendText(
          layer.legend.note,
          [0, maxRadius() * 2 + heightTitleSubtitle() + defaultSpacing * 2 + sizeNote()],
          'note',
        )
      }
    </g>
  </Show>;
}

export default function legendProportionalSymbols(layer: LayerDescription): JSX.Element {
  return <>
    {
      ({
        stacked: proportionalSymbolsStackedLegend,
        vertical: proportionalSymbolsVerticalLegend,
        horizontal: proportionalSymbolsHorizontalLegend,
      })[layer.legend.layout](layer)
    }
  </>;
}
