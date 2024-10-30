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
import { findLayerById } from '../../helpers/layers';

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
import { layersDescriptionStore } from '../../store/LayersDescriptionStore';
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';

// Types / Interfaces / Enums
import { type LayerDescriptionWaffle, type WaffleLegend } from '../../global.d';

const defaultSpacing = applicationSettingsStore.defaultLegendSettings.spacing;

function verticalLegendWaffle(
  legend: WaffleLegend,
): JSX.Element {
  const { LL } = useI18nContext();

  const layer = findLayerById(
    layersDescriptionStore.layers,
    legend.layerId,
  )! as LayerDescriptionWaffle;

  const heightTitle = createMemo(
    () => getTextSize(
      legend.title.text,
      legend.title.fontSize,
      legend.title.fontFamily,
    ).height + defaultSpacing,
  );

  const distanceToTop = createMemo(() => {
    let vDistanceToTop = 0;
    if (legend.title) {
      vDistanceToTop += heightTitle() + defaultSpacing;
    }
    if (legend.subtitle.text) {
      vDistanceToTop += getTextSize(
        legend.subtitle.text,
        legend.subtitle.fontSize,
        legend.subtitle.fontFamily,
      ).height + defaultSpacing;
    }
    // vDistanceToTop += legend.boxSpacing / 2;
    return vDistanceToTop;
  });

  const boxHeightAndSpacing = createMemo(
    () => legend.boxHeight + legend.boxSpacing,
  );

  const labelsAndColors = createMemo(
    () => layer.rendererParameters.variables
      .map(({ displayName, color }) => [displayName, color])
      .toReversed(),
  );

  const positionSymbolValue = createMemo(
    () => distanceToTop()
      + labelsAndColors().length * boxHeightAndSpacing() - legend.boxSpacing
      + (layer.rendererParameters.symbolType === 'circle' ? layer.rendererParameters.size / 2 : 0)
      + legend.spacingBelowBoxes,
  );

  const positionNote = createMemo(
    () => positionSymbolValue()
      + (layer.rendererParameters.symbolType === 'circle' ? layer.rendererParameters.size / 2 : layer.rendererParameters.size)
      + defaultSpacing * 3,
  );

  let refElement: SVGGElement;

  onMount(() => {
    // We need to wait for the legend to be rendered before we can compute its size
    // and bind the drag behavior and the mouse enter / leave behavior.
    bindElementsLegend(refElement, legend);
  });

  createEffect(() => {
    if (refElement && layer.visible && legend.visible) {
      computeRectangleBox(
        refElement,
        distanceToTop(),
        boxHeightAndSpacing(),
        heightTitle(),
        positionNote(),
        legend.boxHeight,
        legend.boxWidth,
        legend.spacingBelowBoxes,
        legend.title.text,
        legend.subtitle.text,
        legend.note.text,
        layer.rendererParameters.variables,
      );
    }
  });

  return <g
    ref={refElement!}
    id={legend.id}
    class="legend waffle"
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
    <RectangleBox backgroundRect={legend.backgroundRect} />
    { makeLegendText(legend.title, [0, 0], 'title') }
    { makeLegendText(legend.subtitle, [0, heightTitle()], 'subtitle') }
    <g class="legend-content">
      <For each={labelsAndColors()}>
        {
          ([_, color], i) => <rect
            fill={color}
            x={0}
            y={distanceToTop() + i() * boxHeightAndSpacing()}
            rx={legend.boxCornerRadius}
            ry={legend.boxCornerRadius}
            width={legend.boxWidth}
            height={legend.boxHeight}
            stroke={legend.stroke ? layer.strokeColor : undefined}
          />
        }
      </For>
      <For each={labelsAndColors()}>
        {
          ([categoryName, _], i) => <text
            x={legend.boxWidth + defaultSpacing}
            y={distanceToTop() + i() * boxHeightAndSpacing() + (legend.boxHeight / 2)}
            font-size={legend.labels.fontSize}
            font-family={legend.labels.fontFamily}
            font-style={legend.labels.fontStyle}
            font-weight={legend.labels.fontWeight}
            fill={legend.labels.fontColor}
            text-anchor="start"
            dominant-baseline="middle"
          >{ categoryName }</text>
        }
      </For>
      <Show when={layer.rendererParameters.symbolType === 'circle'}>
        <circle
          cx={legend.boxWidth / 2}
          cy={positionSymbolValue()}
          r={layer.rendererParameters.size / 2}
          fill={'lightgray'}
          stroke={layer.strokeColor}
        />
      </Show>
      <Show when={layer.rendererParameters.symbolType === 'square'}>
        <rect
          x={legend.boxWidth / 2 - layer.rendererParameters.size / 2}
          y={positionSymbolValue()}
          width={layer.rendererParameters.size}
          height={layer.rendererParameters.size}
          fill={'lightgray'}
          stroke={layer.strokeColor}
        />
      </Show>
      <text
        x={legend.boxWidth + defaultSpacing}
        y={positionSymbolValue() + (layer.rendererParameters.symbolType === 'circle' ? 0 : layer.rendererParameters.size / 2)}
        font-size={legend.valueText.fontSize}
        font-family={legend.valueText.fontFamily}
        font-style={legend.valueText.fontStyle}
        font-weight={legend.valueText.fontWeight}
        fill={legend.valueText.fontColor}
        text-anchor="start"
        dominant-baseline="middle"
      >{legend.valueText.text}</text>
    </g>
    {
      makeLegendText(
        legend.note,
        [0, positionNote()],
        'note',
      )
    }
  </g>;
}

export default function legendWaffle(
  legend: WaffleLegend,
): JSX.Element {
  // We only implement the vertical legend for now
  return verticalLegendWaffle(legend);
}
