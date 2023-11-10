// Import from solid-js
import {
  createEffect, createMemo,
  For, JSX, onMount, Show,
} from 'solid-js';

// Import from other packages
import { getColors } from 'dicopal';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { isNumber } from '../../helpers/common';
import { round } from '../../helpers/math';

// Stores
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';

// Sub-components and helpers for legend rendering
import {
  computeRectangleBox,
  bindDragBehavior,
  bindMouseEnterLeave,
  getTextSize,
  makeLegendSettingsModal,
  makeLegendText,
  makeRectangleBox,
  triggerContextMenuLegend,
} from './common.tsx';

// Import some type descriptions
import {
  ChoroplethLegendParameters,
  type ClassificationParameters,
  type LayerDescription, LayerDescriptionChoropleth,
  Orientation,
  RenderVisibility,
} from '../../global.d';

const defaultSpacing = 5;

function verticalLegend(layer: LayerDescription): JSX.Element {
  // Check that the layer has all the required attributes
  // Since this is done during layer creation, this should not happen in practice,
  // and the following checks are here:
  // - to make Typescript happy
  // - to make sure the layer is correctly defined.
  // In the future, we might want to remove these checks.
  if (!layer.rendererParameters) {
    throw new Error('Classification attribute is not defined - this should not happen');
  }
  const rendererParameters = layer.rendererParameters as ClassificationParameters;

  if (!rendererParameters.palette) {
    throw new Error('Classification.palette attribute is not defined - this should not happen');
  }
  if (!layer.legend) {
    throw new Error('Legend attribute is not defined - this should not happen');
  }

  // const legendParameters = createMemo(() => layer.legend as ChoroplethLegendParameters);
  const legendParameters = layer.legend as ChoroplethLegendParameters;

  const { LL } = useI18nContext();

  const colors = getColors(
    rendererParameters.palette.name,
    rendererParameters.classes,
    rendererParameters.reversePalette,
  ) as string[]; // this can't be undefined because we checked it above

  if (!colors) {
    throw new Error(`Could not get colors for scheme ${layer.rendererParameters.palette.name}`);
  }

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
    (feature) => !isNumber(feature.properties[rendererParameters.variable]),
  ).length > 0);

  const positionNote = createMemo(() => {
    if (hasNoData()) {
      return distanceToTop()
        + (colors.length - 1) * boxHeightAndSpacing()
        + legendParameters.boxSpacingNoData
        + legendParameters.boxHeight * 1.5
        + defaultSpacing * 3
        + getTextSize(
          legendParameters.noDataLabel,
          legendParameters.labels.fontSize,
          legendParameters.labels.fontFamily,
        ).height;
    }
    return distanceToTop() + (colors.length) * boxHeightAndSpacing() + defaultSpacing * 3;
  });

  let refElement: SVGGElement;

  const bindElementsLegend = () => {
    computeRectangleBox(refElement);
    bindMouseEnterLeave(refElement);
    bindDragBehavior(refElement, layer);
  };

  onMount(() => {
    // We need to wait for the legend to be rendered before we can compute its size
    // and bind the drag behavior and the mouse enter / leave behavior.
    bindElementsLegend();
  });

  createEffect(() => {
    if (refElement && layer.visible && legendParameters.visible) {
      computeRectangleBox(
        refElement,
        distanceToTop(),
        boxHeightAndSpacing(),
        heightTitle(),
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
    class="legend choropleth"
    transform={`translate(${layer.legend.position[0]}, ${layer.legend.position[1]})`}
    visibility={layer.visible && layer.legend.visible ? undefined : 'hidden'}
    ondblclick={(e) => { makeLegendSettingsModal(layer.id, LL); }}
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLegend(e, layer.id, LL);
    } }
    style={{ cursor: 'grab' }}
  >
    { makeRectangleBox() }
    { makeLegendText(legendParameters.title, [0, 0], 'title') }
    { makeLegendText(legendParameters.subtitle, [0, heightTitle()], 'subtitle') }
    {
      makeLegendText(
        legendParameters.note,
        [0, positionNote()],
        'note',
      )
    }
    <g class="legend-content">
      <For each={colors.toReversed()}>
        {
          (color, i) => <rect
            fill={color}
            x={0}
            y={distanceToTop() + i() * boxHeightAndSpacing()}
            rx={legendParameters.boxCornerRadius}
            ry={legendParameters.boxCornerRadius}
            width={legendParameters.boxWidth}
            height={legendParameters.boxHeight}
          />
        }
      </For>
      <Show when={hasNoData()}>
        <rect
          fill={rendererParameters.nodataColor}
          x={0}
          y={
            distanceToTop()
            + (colors.length - 1) * boxHeightAndSpacing()
            + legendParameters.boxHeight
            + legendParameters.boxSpacingNoData
          }
          rx={legendParameters.boxCornerRadius}
          ry={legendParameters.boxCornerRadius}
          width={legendParameters.boxWidth}
          height={legendParameters.boxHeight}
        />
      </Show>
      <For each={rendererParameters.breaks.toReversed()}>
        {
          (value, i) => <text
            x={legendParameters.boxWidth + defaultSpacing}
            y={
              distanceToTop()
              + i() * (legendParameters.boxHeight + legendParameters.boxSpacing)
              - legendParameters.boxSpacing / 2
            }
            font-size={legendParameters.labels.fontSize}
            font-family={legendParameters.labels.fontFamily}
            font-style={legendParameters.labels.fontStyle}
            font-weight={legendParameters.labels.fontWeight}
            fill={legendParameters.labels.fontColor}
            style={{ 'user-select': 'none' }}
            text-anchor="start"
            dominant-baseline="middle"
          >{ round(value, legendParameters.roundDecimals).toLocaleString() }</text>
        }
      </For>
      <Show when={hasNoData()}>
        <text
          x={legendParameters.boxWidth + defaultSpacing}
          y={
            distanceToTop()
            + (colors.length - 1) * boxHeightAndSpacing()
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
  </g>;
}

function horizontalLegend(layer: LayerDescriptionChoropleth): JSX.Element {
  // Check that the layer has all the required attributes
  // Since this is done during layer creation, this should not happen in practice
  // and the following checks are here:
  // - to make Typescript happy
  // - to make sure that the layer is correctly defined.
  // In the future, we might want to remove these checks.
  if (!layer.rendererParameters) {
    throw new Error('Classification attribute is not defined - this should not happen');
  }
  const rendererParameters = layer.rendererParameters as ClassificationParameters;

  if (!rendererParameters.palette) {
    throw new Error('Classification.palette attribute is not defined - this should not happen');
  }
  if (!layer.legend) {
    throw new Error('Legend attribute is not defined - this should not happen');
  }

  const legendParameters = layer.legend as ChoroplethLegendParameters;

  const { LL } = useI18nContext();
  const colors = getColors(
    rendererParameters.palette.name,
    rendererParameters.classes,
    rendererParameters.reversePalette,
  ) as string[]; // this can't be undefined because we checked it above

  if (!colors) {
    throw new Error(`Could not get colors for scheme ${rendererParameters.palette.name}`);
  }

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
    (feature) => !isNumber(feature.properties[rendererParameters.variable]),
  ).length > 0);

  let refElement: SVGGElement;

  const bindElementsLegend = () => {
    computeRectangleBox(refElement);
    bindMouseEnterLeave(refElement);
    bindDragBehavior(refElement, layer);
  };

  onMount(() => {
    // We need to wait for the legend to be rendered before we can compute its size
    // and bind the drag behavior and the mouse enter / leave behavior.
    bindElementsLegend();
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
    class="legend choropleth"
    transform={`translate(${legendParameters.position[0]}, ${legendParameters.position[1]})`}
    visibility={layer.visible && legendParameters.visible ? undefined : 'hidden'}
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLegend(e, layer.id, LL);
    } }
    ondblclick={(e) => { makeLegendSettingsModal(layer.id, LL); }}
    style={{ cursor: 'grab' }}
  >
    { makeRectangleBox() }
    { makeLegendText(legendParameters.title, [0, 0], 'title') }
    { makeLegendText(legendParameters.subtitle, [0, heightTitle()], 'subtitle') }
    { makeLegendText(legendParameters.note, [0, distanceNoteToTop()], 'note') }
    <g class="legend-content">
      <For each={colors}>
        {
          (color, i) => <rect
            fill={color}
            x={i() * (legendParameters.boxWidth + legendParameters.boxSpacing)}
            y={distanceBoxesToTop()}
            rx={legendParameters.boxCornerRadius}
            ry={legendParameters.boxCornerRadius}
            width={legendParameters.boxWidth}
            height={legendParameters.boxHeight}
          />
        }
      </For>
      <Show when={hasNoData()}>
        <rect
          fill={rendererParameters.nodataColor}
          x={
            colors.length * (legendParameters.boxWidth + legendParameters.boxSpacing)
            - legendParameters.boxSpacing
            + legendParameters.boxSpacingNoData
          }
          y={distanceBoxesToTop()}
          rx={legendParameters.boxCornerRadius}
          ry={legendParameters.boxCornerRadius}
          width={legendParameters.boxWidth}
          height={legendParameters.boxHeight}
        />
      </Show>
      <For each={rendererParameters.breaks}>
        {
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
            style={{ 'user-select': 'none' }}
            text-anchor="middle"
            dominant-baseline="hanging"
          >{ round(value, legendParameters.roundDecimals).toLocaleString() }</text>
        }
      </For>
      <Show when={hasNoData()}>
        <text
          x={
            colors.length * (legendParameters.boxWidth + legendParameters.boxSpacing)
            + legendParameters.boxSpacingNoData
            + legendParameters.boxWidth / 3
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
  </g>;
}

export default function legendChoropleth(layer: LayerDescriptionChoropleth): JSX.Element {
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
