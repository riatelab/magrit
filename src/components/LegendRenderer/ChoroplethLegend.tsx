// Import from solid-js
import {
  createEffect, createMemo,
  For, JSX, onMount, Show,
} from 'solid-js';

// Import from other packages
import { getColors } from 'dicopal';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { round } from '../../helpers/math';

// Stores
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';

// Sub-components and helpers for legend rendering
import {
  triggerContextMenuLegend,
  makeLegendSubtitle,
  makeLegendTitle,
  makeLegendNote,
  makeRectangleBox,
  computeRectangleBox,
  bindMouseEnterLeave,
  bindDragBehavior,
  getTextSize, makeLegendSettings,
} from './common.tsx';

// Import some type descriptions
import {
  type ClassificationParameters,
  type LayerDescription,
  Orientation,
  RenderVisibility,
} from '../../global.d';

const defaultSpacing = 5;

function choroplethVerticalLegend(layer: LayerDescription): JSX.Element {
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

  const { LL } = useI18nContext();

  const colors = getColors(
    rendererParameters.palette.name,
    rendererParameters.classes,
    rendererParameters.reversePalette,
  ) as string[]; // this can't be undefined because we checked it above

  if (!colors) {
    throw new Error(`Could not get colors for scheme ${layer.rendererParameters.palette.name}`);
  }

  const heightTitle = createMemo(() => +(layer.legend.title.fontSize.replace('px', '')) + defaultSpacing);

  const distanceToTop = createMemo(() => {
    let vDistanceToTop = 0;
    if (layer.legend.title) {
      vDistanceToTop += heightTitle() + defaultSpacing;
    }
    if (layer.legend.subtitle && layer.legend.subtitle.text) {
      vDistanceToTop += +(layer.legend.subtitle.fontSize.replace('px', '')) + defaultSpacing * 2;
    }
    vDistanceToTop += layer.legend!.boxSpacing / 2;
    return vDistanceToTop;
  });

  const boxHeightAndSpacing = createMemo(() => layer.legend.boxHeight + layer.legend.boxSpacing);

  let refElement: SVGElement;

  const bindElementsLegend = () => {
    computeRectangleBox(refElement);
    bindMouseEnterLeave(refElement);
    bindDragBehavior(refElement, layer);
    refElement.style.cursor = 'grab'; // eslint-disable-line no-param-reassign
  };

  onMount(() => {
    bindElementsLegend();
  });

  createEffect(() => {
    console.log('createEffect');
    if (refElement && layer.visible && layer.legend.visible) {
      computeRectangleBox(
        refElement,
        distanceToTop(),
        boxHeightAndSpacing(),
        heightTitle(),
        layer.legend.roundDecimals,
        layer.legend?.boxWidth,
        layer.legend?.title.text,
        layer.legend?.subtitle.text,
        layer.legend?.note.text,
      );
    }
  });

  // console.log(
  //   getTextSize(
  //     layer.legend.title.text,
  //     layer.legend.title.fontSize,
  //     layer.legend.title.fontFamily,
  //   ),
  // );

  return <Show when={
    applicationSettingsStore.renderVisibility === RenderVisibility.RenderAsHidden
    || (layer.visible && layer.legend.visible)
  }>
    <g
      ref={refElement}
      class="legend choropleth"
      transform={`translate(${layer.legend.position[0]}, ${layer.legend.position[1]})`}
      visibility={layer.visible && layer.legend.visible ? undefined : 'hidden'}
      ondblclick={(e) => { console.log(e); makeLegendSettings(layer.id, LL); }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        triggerContextMenuLegend(e, layer.id, LL);
      } }
    >
      { makeRectangleBox() }
      { makeLegendTitle(layer.legend.title, [0, 0]) }
      { makeLegendSubtitle(layer.legend.subtitle, [0, heightTitle()]) }
      {
        makeLegendNote(
          layer.legend.note,
          [0, distanceToTop() + (colors.length + 1) * boxHeightAndSpacing()],
        )
      }
      <g class="legend-content">
        <For each={colors.toReversed()}>
          {
            (color, i) => <rect
              fill={color}
              x={0}
              y={distanceToTop() + i() * boxHeightAndSpacing()}
              rx={layer.legend.boxCornerRadius}
              ry={layer.legend.boxCornerRadius}
              width={layer.legend.boxWidth}
              height={layer.legend.boxHeight}
            />
          }
        </For>
        <For each={layer.rendererParameters.breaks.toReversed()}>
          {
            (value, i) => <text
              x={layer.legend.boxWidth + defaultSpacing}
              y={
                distanceToTop()
                + i() * (layer.legend!.boxHeight + layer.legend!.boxSpacing)
                - layer.legend!.boxSpacing / 2
              }
              font-size={layer.legend.labels.fontSize}
              font-family={layer.legend.labels.fontFamily}
              font-color={layer.legend.labels.fontColor}
              font-style={layer.legend.labels.fontStyle}
              font-weight={layer.legend.labels.fontWeight}
              fill={layer.legend.labels.fontColor}
              style={{ 'user-select': 'none' }}
              text-anchor="start"
              alignment-baseline="middle"
            >{ round(value, layer.legend!.roundDecimals) }</text>
          }
        </For>
      </g>
    </g>
  </Show>;
}

function choroplethHorizontalLegend(layer: LayerDescription): JSX.Element {
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
  const heightTitle = getTextSize(
    layer.legend.title.text,
    layer.legend.title.fontSize,
    layer.legend.title.fontFamily,
  ).height + defaultSpacing;

  const heightSubtitle = createMemo(() => (
    layer.legend.subtitle && layer.legend.subtitle.text
      ? getTextSize(
        layer.legend.subtitle.text,
        layer.legend.subtitle.fontSize,
        layer.legend.subtitle.fontFamily,
      ).height + defaultSpacing
      : 0
  ));

  const heightBox = createMemo(() => layer.legend.boxHeight + defaultSpacing);

  const heightLegendLabels = createMemo(() => getTextSize(
    '12.75',
    layer.legend.labels.fontSize,
    layer.legend.labels.fontFamily,
  ).height + defaultSpacing);

  // The y-position at which the boxes should be placed
  const distanceBoxesToTop = createMemo(() => heightTitle + heightSubtitle());

  // The y-position at which the legend labels should be placed
  const distanceLabelsToTop = createMemo(() => heightTitle
    + heightSubtitle()
    + heightBox()
    + defaultSpacing);

  // The y-position at which the legend note should be placed
  const distanceNoteToTop = createMemo(() => distanceLabelsToTop()
    + heightLegendLabels()
    + defaultSpacing);

  const distanceToEnd = createMemo(() => (
    layer.legend!.boxWidth
    + layer.legend!.boxSpacing) * colors.length);

  let refElement: SVGElement;

  const bindElementsLegend = () => {
    computeRectangleBox(refElement);
    bindMouseEnterLeave(refElement);
    bindDragBehavior(refElement, layer);
    refElement.style.cursor = 'grab'; // eslint-disable-line no-param-reassign
  };

  onMount(() => {
    bindElementsLegend();
  });

  createEffect(() => {
    if (refElement && layer.visible && layer.legend.visible) {
      computeRectangleBox(
        refElement,
        heightBox(),
        heightSubtitle(),
        distanceBoxesToTop(),
        distanceLabelsToTop(),
        distanceNoteToTop(),
        distanceToEnd(),
      );
    }
  });

  return <Show when={
    applicationSettingsStore.renderVisibility === RenderVisibility.RenderAsHidden
    || (layer.visible && layer.legend.visible)
  }>
    <g
      ref={refElement}
      class="legend choropleth"
      transform={`translate(${layer.legend.position[0]}, ${layer.legend.position[1]})`}
      visibility={layer.visible && layer.legend.visible ? undefined : 'hidden'}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        triggerContextMenuLegend(e, layer.id, LL);
      } }
      ondblclick={(e) => { console.log(e); makeLegendSettings(layer.id, LL); }}
    >
      { makeRectangleBox() }
      { makeLegendTitle(layer.legend.title, [0, 0]) }
      { makeLegendSubtitle(layer.legend.subtitle, [0, heightTitle]) }
      { makeLegendNote(layer.legend.note, [0, distanceNoteToTop()]) }
      <g class="legend-content">
        <For each={colors}>
          {
            (color, i) => <rect
              fill={color}
              x={i() * (layer.legend.boxWidth + layer.legend.boxSpacing)}
              y={distanceBoxesToTop()}
              rx={layer.legend.boxCornerRadius}
              ry={layer.legend.boxCornerRadius}
              width={layer.legend.boxWidth}
              height={layer.legend.boxHeight}
            />
          }
        </For>
        <For each={layer.rendererParameters.breaks}>
          {
            (value, i) => <text
              x={
                (i() * (layer.legend.boxWidth + layer.legend.boxSpacing))
                - layer.legend.boxSpacing / 2
              }
              y={distanceLabelsToTop()}
              font-size={layer.legend.labels.fontSize}
              font-family={layer.legend.labels.fontFamily}
              font-color={layer.legend.labels.fontColor}
              font-style={layer.legend.labels.fontStyle}
              font-weight={layer.legend.labels.fontWeight}
              fill={layer.legend.labels.fontColor}
              style={{ 'user-select': 'none', 'text-anchor': 'middle' }}
              text-anchor="start"
              alignment-baseline="middle"
            >{ round(value, layer.legend!.roundDecimals) }</text>
          }
        </For>
      </g>
    </g>
  </Show>;
}

export default function legendChoropleth(layer: LayerDescription): JSX.Element {
  return <>
    {
      ({
        [Orientation.vertical]: choroplethVerticalLegend,
        [Orientation.horizontal]: choroplethHorizontalLegend,
      })[layer.legend!.orientation](layer)
    }
  </>;
}
