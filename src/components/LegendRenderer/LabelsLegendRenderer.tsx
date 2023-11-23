import {
  createEffect,
  createMemo,
  type JSX,
  onMount,
  Show,
} from 'solid-js';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
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
import { applicationSettingsStore, RenderVisibility } from '../../store/ApplicationSettingsStore';
import { LayerDescriptionLabels, LabelsLegendParameters } from '../../global';

const defaultSpacing = 5;

export default function legendLabels(
  layer: LayerDescriptionLabels,
): JSX.Element {
  let refElement: SVGGElement;
  const { LL } = useI18nContext();

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
        layer.legend.labels.text,
        layer.legend.labels.fontSize,
        layer.legend.labels.fontFamily,
      ).height,
    )
    + heightTitleSubtitle()
    + defaultSpacing * 3
  ));

  onMount(() => {
    bindElementsLegend(refElement, layer);
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

  return <Show when={
    applicationSettingsStore.renderVisibility === RenderVisibility.RenderAsHidden
    || (layer.visible && (layer.legend as LabelsLegendParameters).visible)
  }>
    <g
      ref={refElement}
      class="legend labels"
      transform={`translate(${layer.legend?.position[0]}, ${layer.legend?.position[1]})`}
      visibility={layer.visible && layer.legend.visible ? undefined : 'hidden'}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        triggerContextMenuLegend(e, layer.id, LL);
      }}
      onDblClick={() => { makeLegendSettingsModal(layer.id, LL); }}
    >
      <RectangleBox backgroundRect={layer.legend.backgroundRect} />
      { makeLegendText(layer.legend.title, [0, 0], 'title') }
      { makeLegendText(layer.legend?.subtitle, [0, heightTitle()], 'subtitle') }
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
          >{ `: ${layer.legend.labels.text}` }</tspan>
        </text>

      </g>
      {
        makeLegendText(
          layer.legend.note,
          [0, positionNote()],
          'note',
        )
      }
    </g>
  </Show>;
}
