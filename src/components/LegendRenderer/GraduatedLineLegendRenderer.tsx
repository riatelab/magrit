import {
  Accessor,
  createEffect,
  createMemo,
  For,
  type JSX,
  onMount,
} from 'solid-js';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { precisionToMinimumFractionDigits } from '../../helpers/common';
import { findLayerById } from '../../helpers/layers';
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
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';
import { layersDescriptionStore } from '../../store/LayersDescriptionStore';

// Types / Interfaces / Enums
import type { GraduatedLineLegend, LayerDescriptionDiscontinuity, LayerDescriptionLinks } from '../../global';

const defaultSpacing = applicationSettingsStore.defaultLegendSettings.spacing;

function verticalGraduatedLineLegend(
  legend: GraduatedLineLegend,
): JSX.Element {
  const { LL } = useI18nContext();
  let refElement: SVGGElement;
  const layer = findLayerById(
    layersDescriptionStore.layers,
    legend.layerId,
  )! as LayerDescriptionDiscontinuity | LayerDescriptionLinks;
  const heightTitle = createMemo(
    () => getTextSize(
      legend.title.text,
      legend.title.fontSize,
      legend.title.fontFamily,
    ).height + defaultSpacing,
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

  const distanceToTop = createMemo(
    () => heightTitleSubtitle() + getTextSize(
      '1234567890',
      legend.labels.fontSize,
      legend.labels.fontFamily,
    ).height / 2 + defaultSpacing,
  );

  const classificationParameters = createMemo(() => {
    if (layer.representationType === 'discontinuity') {
      return layer.rendererParameters;
    }
    if (layer.representationType === 'links') {
      return layer.rendererParameters.classification;
    }
    throw new Error('Unknown representation type');
  });

  const sizesAndPositions = createMemo(() => {
    let lastSize = 0;
    return classificationParameters().sizes.toReversed()
      .map((size) => {
        const result = {
          size,
          x: 0,
          y: distanceToTop() + lastSize + defaultSpacing,
        };
        lastSize += size + defaultSpacing;
        return result;
      })
      .filter((s) => s.size > 0);
  });

  const positionsLabel = createMemo(() => {
    const reversedBreaks = classificationParameters().breaks
      .filter((b, i) => (
        (i === 0 && classificationParameters().sizes[i] > 0)
        || (
          i > 0 && i < classificationParameters().breaks.length - 1
          && classificationParameters().sizes[i] > 0
        )
        || (i === classificationParameters().breaks.length - 1
          && classificationParameters().sizes[i - 1] > 0)
      ))
      .toReversed();
    const tmp = sizesAndPositions()
      .map((s, i) => ({
        y: s.y - s.size - defaultSpacing,
        breakValue: reversedBreaks[i],
      }));
    tmp.push({
      y: (sizesAndPositions()[sizesAndPositions().length - 1].y
        + sizesAndPositions()[sizesAndPositions().length - 1].size),
      breakValue: reversedBreaks[reversedBreaks.length - 1],
    });
    return tmp;
  });

  const positionNote = createMemo(() => (
    positionsLabel()[positionsLabel().length - 1].y
    + getTextSize(
      legend.note.text,
      legend.note.fontSize,
      legend.note.fontFamily,
    ).height + defaultSpacing
  ));

  onMount(() => {
    bindElementsLegend(refElement, legend);
  });

  createEffect(() => {
    if (refElement && layer.visible && legend.visible) {
      computeRectangleBox(
        refElement,
        heightTitle(),
        heightTitleSubtitle(),
        positionNote(),
        positionsLabel(),
        sizesAndPositions(),
        legend.lineLength,
        legend.title.text,
        legend.subtitle.text,
        legend.note.text,
        legend.roundDecimals,
      );
    }
  });

  return <g
    ref={refElement!}
    id={legend.id}
    class="legend discontinuity"
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
      <For each={sizesAndPositions()}>
        {
          ({ size, y }) => <line
            x1={0}
            x2={legend.lineLength}
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
            x={legend.lineLength + defaultSpacing}
            y={y}
            font-size={legend.labels.fontSize}
            font-family={legend.labels.fontFamily}
            font-style={legend.labels.fontStyle}
            font-weight={legend.labels.fontWeight}
            text-anchor="start"
            dominant-baseline="hanging"
          >{
            round(breakValue, legend.roundDecimals)
              .toLocaleString(
                applicationSettingsStore.userLocale,
                {
                  minimumFractionDigits: precisionToMinimumFractionDigits(
                    legend.roundDecimals,
                  ),
                },
              )
          }</text>
        }
      </For>
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

function horizontalGraduatedLineLegend(
  legend: GraduatedLineLegend,
): JSX.Element {
  const { LL } = useI18nContext();
  let refElement: SVGGElement;
  const layer = findLayerById(
    layersDescriptionStore.layers,
    legend.layerId,
  )! as LayerDescriptionDiscontinuity | LayerDescriptionLinks;
  const heightTitle = createMemo(
    () => getTextSize(
      legend.title.text,
      legend.title.fontSize,
      legend.title.fontFamily,
    ).height + defaultSpacing,
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

  const classificationParameters = createMemo(() => {
    if (layer.representationType === 'discontinuity') {
      return layer.rendererParameters;
    }
    if (layer.representationType === 'links') {
      return layer.rendererParameters.classification;
    }
    throw new Error('Unknown representation type');
  });

  const maxSize = createMemo(
    () => classificationParameters().sizes[classificationParameters().sizes.length - 1],
  );

  const distanceLabelsToTop = createMemo(() => heightTitleSubtitle()
    + maxSize()
    + defaultSpacing);

  const positionNote = createMemo(() => (
    distanceLabelsToTop() + defaultSpacing + legend.labels.fontSize
  ));

  onMount(() => {
    bindElementsLegend(refElement, legend);
  });

  createEffect(() => {
    if (refElement && layer.visible && legend.visible) {
      computeRectangleBox(
        refElement,
        heightTitle(),
        heightTitleSubtitle(),
        positionNote(),
        maxSize(),
        legend.title.text,
        legend.subtitle.text,
        legend.note.text,
        legend.roundDecimals,
        legend.lineLength,
      );
    }
  });

  return <g
    ref={refElement!}
    id={legend.id}
    class="legend discontinuity"
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
      <For each={classificationParameters().sizes.filter((s) => s > 0)}>
        {
          (size, i) => <line
            x1={i() * legend.lineLength}
            x2={(i() + 1) * legend.lineLength}
            y1={heightTitleSubtitle() + defaultSpacing}
            y2={heightTitleSubtitle() + defaultSpacing}
            stroke={layer.strokeColor}
            stroke-width={size}
          >
          </line>
        }
      </For>
      <For each={
        classificationParameters().breaks
          .filter((b, i) => (
            (i === 0 && classificationParameters().sizes[i] > 0)
            || (
              i > 0 && i < classificationParameters().breaks.length - 1
              && classificationParameters().sizes[i] > 0
            )
            || (i === classificationParameters().breaks.length - 1
              && classificationParameters().sizes[i - 1] > 0)
          ))
      }>
        {
          (breakValue, i) => <text
            x={i() * legend.lineLength}
            y={distanceLabelsToTop()}
            font-size={legend.labels.fontSize}
            font-family={legend.labels.fontFamily}
            font-style={legend.labels.fontStyle}
            font-weight={legend.labels.fontWeight}
            text-anchor="middle"
            dominant-baseline="hanging"
          >{
            round(breakValue, legend.roundDecimals)
              .toLocaleString(
                applicationSettingsStore.userLocale,
                {
                  minimumFractionDigits: precisionToMinimumFractionDigits(
                    legend.roundDecimals,
                  ),
                },
              )
          }</text>
        }
      </For>
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
export default function graduatedLineDiscontinuity(
  legend: GraduatedLineLegend,
): JSX.Element {
  return <>
    {
      ({
        vertical: verticalGraduatedLineLegend,
        horizontal: horizontalGraduatedLineLegend,
      })[legend.orientation](legend)
    }
  </>;
}
