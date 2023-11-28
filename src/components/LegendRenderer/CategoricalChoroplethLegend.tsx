// Import from solid-js
import {
  createEffect,
  createMemo,
  For,
  JSX,
  onMount,
  Show,
} from 'solid-js';

// Import from other packages

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { isNonNull } from '../../helpers/common';

// Stores
import { applicationSettingsStore, RenderVisibility } from '../../store/ApplicationSettingsStore';

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
import type {
  CategoricalChoroplethParameters,
  ChoroplethLegendParameters,
  LayerDescriptionCategoricalChoropleth,
} from '../../global';

import { Orientation } from '../../global.d';

const defaultSpacing = applicationSettingsStore.defaultLegendSettings.spacing;

function verticalLegend(layer: LayerDescriptionCategoricalChoropleth): JSX.Element {
  // Check that the layer has all the required attributes
  // Since this is done during layer creation, this should not happen in practice,
  // and the following checks are here:
  // - to make Typescript happy
  // - to make sure the layer is correctly defined.
  // In the future, we might want to remove these checks.
  if (!layer.rendererParameters) {
    throw new Error('Classification attribute is not defined - this should not happen');
  }
  const rendererParameters = layer.rendererParameters as CategoricalChoroplethParameters;

  if (!layer.legend) {
    throw new Error('Legend attribute is not defined - this should not happen');
  }

  // const legendParameters = createMemo(() => layer.legend as ChoroplethLegendParameters);
  const legendParameters = layer.legend as ChoroplethLegendParameters;

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
    return vDistanceToTop;
  });

  const boxHeightAndSpacing = createMemo(
    () => legendParameters.boxHeight + legendParameters.boxSpacing,
  );

  const hasNoData = createMemo(() => layer.data.features.filter(
    (feature) => !isNonNull(feature.properties[rendererParameters.variable]),
  ).length > 0);

  const labelsAndColors = createMemo(
    () => rendererParameters.mapping.map(([_, categoryName, color]) => [categoryName, color]),
  );

  const positionNote = createMemo(() => {
    if (hasNoData()) {
      return distanceToTop()
        + (labelsAndColors().length) * boxHeightAndSpacing()
        - legendParameters.boxSpacing
        + legendParameters.boxSpacingNoData
        + legendParameters.boxHeight
        + defaultSpacing * 3;
    }
    return distanceToTop() + labelsAndColors().length * boxHeightAndSpacing() + defaultSpacing * 3;
  });

  let refElement: SVGGElement;

  onMount(() => {
    // We need to wait for the legend to be rendered before we can compute its size
    // and bind the drag behavior and the mouse enter / leave behavior.
    bindElementsLegend(refElement, layer);
  });

  createEffect(() => {
    if (refElement && layer.visible && legendParameters.visible) {
      computeRectangleBox(
        refElement,
        distanceToTop(),
        boxHeightAndSpacing(),
        heightTitle(),
        hasNoData(),
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
    ref={refElement}
    class="legend categoricalChoropleth"
    for={layer.id}
    transform={`translate(${layer.legend.position[0]}, ${layer.legend.position[1]})`}
    visibility={layer.visible && layer.legend.visible ? undefined : 'hidden'}
    onDblClick={() => { makeLegendSettingsModal(layer.id, LL); }}
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLegend(e, layer.id, LL);
    } }
    style={{ cursor: 'grab' }}
  >
    <RectangleBox backgroundRect={legendParameters.backgroundRect} />
    { makeLegendText(legendParameters.title, [0, 0], 'title') }
    { makeLegendText(legendParameters.subtitle, [0, heightTitle()], 'subtitle') }
    <g class="legend-content">
      <For each={labelsAndColors()}>
        {
          ([categoryName, color], i) => <rect
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
            + (labelsAndColors().length - 1) * boxHeightAndSpacing()
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
      <For each={labelsAndColors()}>
        {
          ([categoryName, color], i) => <text
            x={legendParameters.boxWidth + defaultSpacing}
            y={distanceToTop() + i() * boxHeightAndSpacing() + (legendParameters.boxHeight / 2)}
            font-size={legendParameters.labels.fontSize}
            font-family={legendParameters.labels.fontFamily}
            font-style={legendParameters.labels.fontStyle}
            font-weight={legendParameters.labels.fontWeight}
            fill={legendParameters.labels.fontColor}
            style={{ 'user-select': 'none' }}
            text-anchor="start"
            dominant-baseline="middle"
          >{ categoryName }</text>
        }
      </For>
      <Show when={hasNoData()}>
        <text
          x={legendParameters.boxWidth + defaultSpacing}
          y={
            distanceToTop()
            + (labelsAndColors().length - 1) * boxHeightAndSpacing()
            + legendParameters.boxSpacingNoData
            + legendParameters.boxHeight * 1.5
            + defaultSpacing / 3
          }
          font-size={legendParameters.labels.fontSize}
          font-family={legendParameters.labels.fontFamily}
          font-style={legendParameters.labels.fontStyle}
          font-weight={legendParameters.labels.fontWeight}
          fill={legendParameters.labels.fontColor}
          style={{ 'user-select': 'none' }}
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

function horizontalLegend(layer: LayerDescriptionCategoricalChoropleth): JSX.Element {
  // Check that the layer has all the required attributes
  // Since this is done during layer creation, this should not happen in practice
  // and the following checks are here:
  // - to make Typescript happy
  // - to make sure that the layer is correctly defined.
  // In the future, we might want to remove these checks.
  if (!layer.rendererParameters) {
    throw new Error('Classification attribute is not defined - this should not happen');
  }
  const rendererParameters = layer.rendererParameters as CategoricalChoroplethParameters;

  if (!layer.legend) {
    throw new Error('Legend attribute is not defined - this should not happen');
  }

  const legendParameters = layer.legend as ChoroplethLegendParameters;

  const { LL } = useI18nContext();

  // We need to compute the position of:
  // - the legend title
  // - the legend (optional) subtitle
  // - the legend note
  // To do so, we need to know the size of each of these elements (and the presence / absence of
  // each of them).
  const heightTitle = createMemo(() => (getTextSize(
    legendParameters.title.text,
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
    (feature) => !isNonNull(feature.properties[rendererParameters.variable]),
  ).length > 0);

  const labelsAndColors = createMemo(
    () => rendererParameters.mapping.map(([_, categoryName, color]) => [categoryName, color]),
  );

  let refElement: SVGGElement;

  onMount(() => {
    // We need to wait for the legend to be rendered before we can compute its size
    // and bind the drag behavior and the mouse enter / leave behavior.
    bindElementsLegend(refElement, layer);
  });

  createEffect(() => {
    if (refElement && layer.visible && layer.legend?.visible) {
      computeRectangleBox(
        refElement,
        heightBox(),
        heightSubtitle(),
        distanceBoxesToTop(),
        distanceLabelsToTop(),
        distanceNoteToTop(),
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
    ref={refElement}
    class="legend categoricalChoropleth"
    for={layer.id}
    transform={`translate(${legendParameters.position[0]}, ${legendParameters.position[1]})`}
    visibility={layer.visible && legendParameters.visible ? undefined : 'hidden'}
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLegend(e, layer.id, LL);
    } }
    onDblClick={() => { makeLegendSettingsModal(layer.id, LL); }}
    style={{ cursor: 'grab' }}
  >
    <RectangleBox backgroundRect={legendParameters.backgroundRect} />
    { makeLegendText(legendParameters.title, [0, 0], 'title') }
    { makeLegendText(legendParameters.subtitle, [0, heightTitle()], 'subtitle') }
    <g class="legend-content">
      <For each={labelsAndColors()}>
        {
          ([categoryName, color], i) => <rect
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
            labelsAndColors().length * (legendParameters.boxWidth + legendParameters.boxSpacing)
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
      <For each={labelsAndColors()}>
        {
          ([categoryName, color], i) => <text
            x={
              (i() * (legendParameters.boxWidth + legendParameters.boxSpacing))
              + legendParameters.boxWidth / 2 // Center the text
            }
            y={distanceLabelsToTop()}
            font-size={legendParameters.labels.fontSize}
            font-family={legendParameters.labels.fontFamily}
            font-style={legendParameters.labels.fontStyle}
            font-weight={legendParameters.labels.fontWeight}
            fill={legendParameters.labels.fontColor}
            style={{ 'user-select': 'none' }}
            text-anchor="middle"
            dominant-baseline="hanging"
          >{ categoryName }</text>
        }
      </For>
      <Show when={hasNoData()}>
        <text
          x={
            labelsAndColors().length * (legendParameters.boxWidth + legendParameters.boxSpacing)
            - legendParameters.boxSpacing // Remove the last box spacing
            + legendParameters.boxSpacingNoData // and replace it with the no data box spacing
            + legendParameters.boxWidth / 2 // Center the text
          }
          y={distanceLabelsToTop()}
          font-size={legendParameters.labels.fontSize}
          font-family={legendParameters.labels.fontFamily}
          font-style={legendParameters.labels.fontStyle}
          font-weight={legendParameters.labels.fontWeight}
          fill={legendParameters.labels.fontColor}
          style={{ 'user-select': 'none' }}
          text-anchor="middle"
          dominant-baseline="hanging"
        >{ legendParameters.noDataLabel }</text>
      </Show>
    </g>
    { makeLegendText(legendParameters.note, [0, distanceNoteToTop()], 'note') }
  </g>;
}

export default function legendCategoricalChoropleth(
  layer: LayerDescriptionCategoricalChoropleth,
): JSX.Element {
  return <Show when={
    applicationSettingsStore.renderVisibility === RenderVisibility.RenderAsHidden
    || (layer.visible && layer.legend!.visible)
  }>
    {
      ({
        [Orientation.vertical]: verticalLegend,
        [Orientation.horizontal]: horizontalLegend,
      })[(layer.legend as ChoroplethLegendParameters).orientation](layer)
    }
  </Show>;
}
