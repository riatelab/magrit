// Import from solid-js
import {
  createEffect, createMemo,
  For, JSX, onMount, Show,
} from 'solid-js';

// Import from other packages
import { range } from 'd3-array';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { isNumber, precisionToMinimumFractionDigits } from '../../helpers/common';
import { findLayerById } from '../../helpers/layers';
import { round } from '../../helpers/math';

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
import {
  type AllowChoroplethLegend,
  type ChoroplethLegend,
  type ClassificationParameters,
  Orientation,
} from '../../global.d';

const defaultSpacing = applicationSettingsStore.defaultLegendSettings.spacing;

function verticalLegend(
  legendParameters: ChoroplethLegend,
): JSX.Element {
  const layer = findLayerById(
    layersDescriptionStore.layers,
    legendParameters.layerId,
  )!;

  const rendererParameters = layer.renderer === 'proportionalSymbols'
    ? layer.rendererParameters!.color as ClassificationParameters
    : layer.rendererParameters as AllowChoroplethLegend;

  const { LL } = useI18nContext();

  const heightTitle = createMemo(() => (
    getTextSize(
      legendParameters.title.text,
      legendParameters.title.fontSize,
      legendParameters.title.fontFamily,
    ).height
  ));

  const distanceToTop = createMemo(() => {
    let vDistanceToTop = 0;
    if (legendParameters.title) {
      vDistanceToTop += heightTitle() + defaultSpacing;
    }
    if (legendParameters.subtitle && legendParameters.subtitle.text) {
      vDistanceToTop += getTextSize(
        legendParameters.subtitle.text,
        legendParameters.subtitle.fontSize,
        legendParameters.subtitle.fontFamily,
      ).height + defaultSpacing;
    }
    vDistanceToTop += legendParameters.boxSpacing / 2;
    vDistanceToTop += getTextSize(
      '1234567890',
      legendParameters.labels.fontSize,
      legendParameters.labels.fontFamily,
    ).height / 2;
    return vDistanceToTop;
  });

  const boxHeightAndSpacing = createMemo(
    () => legendParameters.boxHeight + legendParameters.boxSpacing,
  );

  const hasNoData = createMemo(() => layer.data.features.filter(
    (feature) => !isNumber(feature.properties[rendererParameters.variable]),
  ).length > 0);

  const positionNote = createMemo(() => {
    if (hasNoData()) {
      return distanceToTop()
        + rendererParameters.palette.colors.length * boxHeightAndSpacing()
        - legendParameters.boxSpacing
        + legendParameters.boxSpacingNoData
        + legendParameters.boxHeight
        + defaultSpacing * 3;
    }
    return distanceToTop()
      + (rendererParameters.palette.colors.length) * boxHeightAndSpacing()
      + getTextSize(
        legendParameters.noDataLabel,
        legendParameters.labels.fontSize,
        legendParameters.labels.fontFamily,
      ).height / 2
      + defaultSpacing * 3;
  });

  let refElement: SVGGElement;

  onMount(() => {
    // We need to wait for the legend to be rendered before we can compute its size
    // and bind the drag behavior and the mouse enter / leave behavior.
    bindElementsLegend(refElement, legendParameters);
  });

  createEffect(() => {
    if (refElement && layer.visible && legendParameters.visible) {
      computeRectangleBox(
        refElement,
        distanceToTop(),
        boxHeightAndSpacing(),
        heightTitle(),
        hasNoData(),
        positionNote(),
        legendParameters.roundDecimals,
        legendParameters.boxWidth,
        legendParameters.title.text,
        legendParameters.subtitle?.text,
        legendParameters.note?.text,
        legendParameters.roundDecimals,
        legendParameters.boxSpacing,
        legendParameters.boxSpacingNoData,
      );
    }
  });

  return <g
    ref={refElement!}
    class="legend choropleth"
    for={layer.id}
    transform={`translate(${legendParameters.position[0]}, ${legendParameters.position[1]})`}
    visibility={layer.visible && legendParameters.visible ? undefined : 'hidden'}
    onDblClick={() => { makeLegendSettingsModal(legendParameters.id, LL); }}
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLegend(e, legendParameters.id, LL);
    } }
    style={{ cursor: 'grab' }}
  >
    <RectangleBox backgroundRect={legendParameters.backgroundRect} />
    { makeLegendText(legendParameters.title, [0, 0], 'title') }
    { makeLegendText(legendParameters.subtitle, [0, heightTitle()], 'subtitle') }
    <g class="legend-content">
      <For each={rendererParameters.palette.colors.toReversed()}>
        {
          (color, i) => <rect
            fill={color}
            x={0}
            y={distanceToTop() + i() * boxHeightAndSpacing()}
            rx={legendParameters.boxCornerRadius}
            ry={legendParameters.boxCornerRadius}
            width={legendParameters.boxWidth}
            height={legendParameters.boxHeight}
            stroke={legendParameters.stroke ? layer.strokeColor : undefined}
          />
        }
      </For>
      <Show when={hasNoData()}>
        <rect
          fill={rendererParameters.noDataColor}
          x={0}
          y={
            distanceToTop()
            + (rendererParameters.palette.colors.length - 1) * boxHeightAndSpacing()
            + legendParameters.boxHeight
            + legendParameters.boxSpacingNoData
          }
          rx={legendParameters.boxCornerRadius}
          ry={legendParameters.boxCornerRadius}
          width={legendParameters.boxWidth}
          height={legendParameters.boxHeight}
          stroke={legendParameters.stroke ? layer.strokeColor : undefined}
        />
      </Show>
      <Show when={legendParameters.tick}>
        <For each={range(1, rendererParameters.palette.colors.length, 1)}>
          {
            (i) => <line
              x1={0}
              x2={legendParameters.boxWidth + (2 * defaultSpacing) / 3}
              y1={distanceToTop() + i * boxHeightAndSpacing()}
              y2={distanceToTop() + i * boxHeightAndSpacing()}
              stroke={legendParameters.labels.fontColor}
              stroke-width={1}
            />
          }
        </For>
      </Show>
      <For each={rendererParameters.breaks.toReversed()}>
        {
          (value, i) => <text
            x={legendParameters.boxWidth + defaultSpacing}
            y={
              distanceToTop()
              + i() * boxHeightAndSpacing()
              - legendParameters.boxSpacing / 2
            }
            font-size={legendParameters.labels.fontSize}
            font-family={legendParameters.labels.fontFamily}
            font-style={legendParameters.labels.fontStyle}
            font-weight={legendParameters.labels.fontWeight}
            fill={legendParameters.labels.fontColor}
            text-anchor="start"
            dominant-baseline="middle"
          >{
            round(value, legendParameters.roundDecimals)
              .toLocaleString(
                applicationSettingsStore.userLocale,
                {
                  minimumFractionDigits: precisionToMinimumFractionDigits(
                    legendParameters.roundDecimals,
                  ),
                },
              )
          }</text>
        }
      </For>
      <Show when={hasNoData()}>
        <text
          x={legendParameters.boxWidth + defaultSpacing}
          y={
            distanceToTop()
            + (rendererParameters.palette.colors.length - 1) * boxHeightAndSpacing()
            + legendParameters.boxSpacingNoData
            + legendParameters.boxHeight * 1.5
            + defaultSpacing / 3
          }
          font-size={legendParameters.labels.fontSize}
          font-family={legendParameters.labels.fontFamily}
          font-style={legendParameters.labels.fontStyle}
          font-weight={legendParameters.labels.fontWeight}
          fill={legendParameters.labels.fontColor}
          text-anchor="start"
          dominant-baseline="middle"
        >{ legendParameters.noDataLabel }</text>
      </Show>
    </g>
    {
      makeLegendText(
        legendParameters.note,
        [0, positionNote()],
        'note',
      )
    }
  </g>;
}

function horizontalLegend(
  legendParameters: ChoroplethLegend,
): JSX.Element {
  const layer = findLayerById(
    layersDescriptionStore.layers,
    legendParameters.layerId,
  )!;

  const rendererParameters = layer.renderer === 'proportionalSymbols'
    ? layer.rendererParameters!.color as ClassificationParameters
    : layer.rendererParameters as AllowChoroplethLegend;

  const { LL } = useI18nContext();

  // We need to compute the position of:
  // - the legend title
  // - the legend (optional) subtitle
  // - the legend note
  // To do so, we need to know the size of each of these elements (and the presence / absence of
  // each of them).
  const heightTitle = createMemo(() => (getTextSize(
    legendParameters.title.text || '',
    legendParameters.title.fontSize,
    legendParameters.title.fontFamily,
  ).height + defaultSpacing));

  const heightSubtitle = createMemo(() => (
    legendParameters.subtitle && legendParameters.subtitle.text
      ? getTextSize(
        legendParameters.subtitle.text,
        legendParameters.subtitle.fontSize,
        legendParameters.subtitle.fontFamily,
      ).height + defaultSpacing
      : 0
  ));

  const heightBox = createMemo(() => legendParameters.boxHeight + defaultSpacing);

  const heightLegendLabels = createMemo(() => getTextSize(
    '12.75',
    legendParameters.labels.fontSize,
    legendParameters.labels.fontFamily,
  ).height + defaultSpacing);

  // The y-position at which the boxes should be placed
  const distanceBoxesToTop = createMemo(() => heightTitle() + heightSubtitle());

  // The y-position at which the legend labels should be placed
  const distanceLabelsToTop = createMemo(() => heightTitle()
    + heightSubtitle()
    + heightBox()
    + defaultSpacing);

  // The y-position at which the legend note should be placed
  const distanceNoteToTop = createMemo(() => distanceLabelsToTop()
    + heightLegendLabels());

  const hasNoData = createMemo(() => layer.data.features.filter(
    (feature) => !isNumber(feature.properties[rendererParameters.variable]),
  ).length > 0);

  let refElement: SVGGElement;

  onMount(() => {
    // We need to wait for the legend to be rendered before we can compute its size
    // and bind the drag behavior and the mouse enter / leave behavior.
    bindElementsLegend(refElement, legendParameters);
  });

  createEffect(() => {
    if (refElement && layer.visible && legendParameters.visible) {
      computeRectangleBox(
        refElement,
        heightBox(),
        heightSubtitle(),
        distanceBoxesToTop(),
        distanceLabelsToTop(),
        distanceNoteToTop(),
        hasNoData(),
        legendParameters.title.text,
        legendParameters.subtitle?.text,
        legendParameters.note?.text,
        legendParameters.roundDecimals,
        legendParameters.boxSpacing,
        legendParameters.boxSpacingNoData,
        legendParameters.boxWidth,
      );
    }
  });

  return <g
    ref={refElement!}
    class="legend choropleth"
    for={layer.id}
    transform={`translate(${legendParameters.position[0]}, ${legendParameters.position[1]})`}
    visibility={layer.visible && legendParameters.visible ? undefined : 'hidden'}
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLegend(e, legendParameters.id, LL);
    } }
    onDblClick={() => { makeLegendSettingsModal(legendParameters.id, LL); }}
    style={{ cursor: 'grab' }}
  >
    <RectangleBox backgroundRect={legendParameters.backgroundRect} />
    { makeLegendText(legendParameters.title, [0, 0], 'title') }
    { makeLegendText(legendParameters.subtitle, [0, heightTitle()], 'subtitle') }
    <g class="legend-content">
      <For each={rendererParameters.palette.colors}>
        {
          (color, i) => <rect
            fill={color}
            x={i() * (legendParameters.boxWidth + legendParameters.boxSpacing)}
            y={distanceBoxesToTop()}
            rx={legendParameters.boxCornerRadius}
            ry={legendParameters.boxCornerRadius}
            width={legendParameters.boxWidth}
            height={legendParameters.boxHeight}
            stroke={legendParameters.stroke ? layer.strokeColor : undefined}
          />
        }
      </For>
      <Show when={hasNoData()}>
        <rect
          fill={rendererParameters.noDataColor}
          x={
            rendererParameters.palette.colors.length * (
              legendParameters.boxWidth + legendParameters.boxSpacing
            )
            - legendParameters.boxSpacing
            + legendParameters.boxSpacingNoData
          }
          y={distanceBoxesToTop()}
          rx={legendParameters.boxCornerRadius}
          ry={legendParameters.boxCornerRadius}
          width={legendParameters.boxWidth}
          height={legendParameters.boxHeight}
          stroke={legendParameters.stroke ? layer.strokeColor : undefined}
        />
      </Show>
      <Show when={legendParameters.tick}>
        <For each={range(1, rendererParameters.palette.colors.length, 1)}>
          {
            (i) => <line
              x1={
                (i * (legendParameters.boxWidth + legendParameters.boxSpacing))
              }
              x2={
                (i * (legendParameters.boxWidth + legendParameters.boxSpacing))
              }
              y1={distanceBoxesToTop()}
              y2={distanceBoxesToTop() + legendParameters.boxHeight + (2 * defaultSpacing) / 3}
              stroke={legendParameters.labels.fontColor}
              stroke-width={1}
            />
          }
        </For>
      </Show>
      <For each={rendererParameters.breaks}>
        { // TODO: Last break value should take into account
          //  the boxSpacingNoData parameter if there is no data
          //  (especially if the boxSpacingNoData is inferior to the boxSpacing... which is
          //  somehow a weird case)
          (value, i) => <text
            x={
              (i() * (legendParameters.boxWidth + legendParameters.boxSpacing))
              - legendParameters.boxSpacing / 2
            }
            y={distanceLabelsToTop()}
            font-size={legendParameters.labels.fontSize}
            font-family={legendParameters.labels.fontFamily}
            font-style={legendParameters.labels.fontStyle}
            font-weight={legendParameters.labels.fontWeight}
            fill={legendParameters.labels.fontColor}
            text-anchor="middle"
            dominant-baseline="hanging"
          >{
            round(value, legendParameters.roundDecimals)
              .toLocaleString(
                applicationSettingsStore.userLocale,
                {
                  minimumFractionDigits: precisionToMinimumFractionDigits(
                    legendParameters.roundDecimals,
                  ),
                },
              )
          }</text>
        }
      </For>
      <Show when={hasNoData()}>
        <text
          x={
            rendererParameters.palette.colors.length * (
              legendParameters.boxWidth + legendParameters.boxSpacing
            )
            - legendParameters.boxSpacing
            + legendParameters.boxSpacingNoData
            + legendParameters.boxWidth / 2
          }
          y={distanceLabelsToTop()}
          font-size={legendParameters.labels.fontSize}
          font-family={legendParameters.labels.fontFamily}
          font-style={legendParameters.labels.fontStyle}
          font-weight={legendParameters.labels.fontWeight}
          fill={legendParameters.labels.fontColor}
          text-anchor="middle"
          dominant-baseline="hanging"
        >{ legendParameters.noDataLabel }</text>
      </Show>
    </g>
    { makeLegendText(legendParameters.note, [0, distanceNoteToTop()], 'note') }
  </g>;
}

export default function legendChoropleth(
  legend: ChoroplethLegend,
): JSX.Element {
  return <>
    {
      ({
        [Orientation.vertical]: verticalLegend,
        [Orientation.horizontal]: horizontalLegend,
      })[legend.orientation](legend)
    }
  </>;
}
