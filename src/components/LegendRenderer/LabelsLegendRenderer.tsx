import {
  createEffect,
  createMemo,
  type JSX,
  onMount,
} from 'solid-js';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { findLayerById } from '../../helpers/layers';
import { Mmax } from '../../helpers/math';

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

import type { LayerDescriptionLabels, LabelsLegend } from '../../global';

const defaultSpacing = applicationSettingsStore.defaultLegendSettings.spacing;

export default function legendLabels(
  legend: LabelsLegend,
): JSX.Element {
  let refElement: SVGGElement;
  const { LL } = useI18nContext();
  const layer = findLayerById(
    layersDescriptionStore.layers,
    legend.layerId,
  )! as LayerDescriptionLabels;
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
  const sizeDisplayedEntry = createMemo(() => getTextSize(
    `${layer.data.features[0].properties[layer.rendererParameters.variable]}`,
    layer.rendererParameters.fontSize,
    layer.rendererParameters.fontFamily,
    layer.rendererParameters.halo ? layer.rendererParameters.halo.width : 0,
  ));

  const positionNote = createMemo(() => (
    Mmax(
      sizeDisplayedEntry().height,
      getTextSize(
        legend.labels.text,
        legend.labels.fontSize,
        legend.labels.fontFamily,
      ).height,
    )
    + heightTitleSubtitle()
    + defaultSpacing * 3
  ));

  onMount(() => {
    bindElementsLegend(refElement, legend);
  });

  createEffect(() => {
    computeRectangleBox(
      refElement,
      layer,
      heightTitle(),
      heightTitleSubtitle(),
      positionNote(),
    );
  });

  return <g
    ref={refElement!}
    id={legend.id}
    class="legend labels"
    for={layer.id}
    transform={`translate(${legend.position[0]}, ${legend.position[1]})`}
    visibility={layer.visible && legend.visible ? undefined : 'hidden'}
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLegend(e, legend.id, LL);
    }}
    onDblClick={() => { makeLegendSettingsModal(legend.id, LL); }}
  >
    <RectangleBox backgroundRect={legend.backgroundRect} />
    { makeLegendText(legend.title, [0, 0], 'title') }
    { makeLegendText(legend.subtitle, [0, heightTitle()], 'subtitle') }
    <g class="legend-content">
      <text
        x={0}
        y={heightTitleSubtitle() + sizeDisplayedEntry().height}
      >
        <tspan
          x={0}
          text-anchor="start"
          font-style={layer.rendererParameters.fontStyle}
          font-family={layer.rendererParameters.fontFamily}
          font-size={layer.rendererParameters.fontSize}
          font-weight={layer.rendererParameters.fontWeight}
          fill={layer.rendererParameters.fontColor}
          {...(
            layer.rendererParameters.halo
              ? { stroke: layer.rendererParameters.halo.color, 'stroke-width': layer.rendererParameters.halo.width }
              : {}
          )}
          style={{ 'paint-order': 'stroke' }}
        >{ layer.data.features[0].properties[layer.rendererParameters.variable] }</tspan>
        <tspan
          text-anchor="start"
          x={sizeDisplayedEntry().width}
        >{ `: ${legend.labels.text}` }</tspan>
      </text>
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
