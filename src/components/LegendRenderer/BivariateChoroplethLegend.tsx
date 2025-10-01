import {
  createEffect,
  createMemo,
  For,
  type JSX,
  onMount,
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
import { type LayerDescriptionBivariateChoropleth, type BivariateChoroplethLegend } from '../../global';

const defaultSpacing = applicationSettingsStore.defaultLegendSettings.spacing;

function legendBivariateChoropleth(
  legend: BivariateChoroplethLegend,
): JSX.Element {
  const { LL } = useI18nContext();

  const layer = findLayerById(
    layersDescriptionStore.layers,
    legend.layerId,
  )! as LayerDescriptionBivariateChoropleth;

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

  // const positionNote = createMemo(
  //   () => positionSymbolValue()
  //     + getTextSize(
  //       legend.valueText.text,
  //       legend.labels.fontSize,
  //       legend.labels.fontFamily,
  //     ).height
  //     + defaultSpacing,
  // );

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
        // And more...
      );
    }
  });

  return <g
    ref={refElement!}
    id={legend.id}
    class="legend bichoro"
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