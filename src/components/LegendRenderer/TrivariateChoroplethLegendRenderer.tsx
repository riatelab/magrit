import {
  createEffect,
  createMemo,
  For,
  type JSX,
  Match,
  onMount,
  Show,
  Switch,
} from 'solid-js';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { precisionToMinimumFractionDigits } from '../../helpers/common';
import { findLayerById } from '../../helpers/layers';
import { round } from '../../helpers/math';

// Subcomponents and helpers for legend rendering
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
import {
  type LayerDescriptionTrivariateChoropleth,
  type TrivariateChoroplethLegend,
} from '../../global';

const defaultSpacing = applicationSettingsStore.defaultLegendSettings.spacing;

export default function legendTrivariateChoropleth(
  legend: TrivariateChoroplethLegend,
): JSX.Element {
  const { LL } = useI18nContext();

  const layer = findLayerById(
    layersDescriptionStore.layers,
    legend.layerId,
  )! as LayerDescriptionTrivariateChoropleth;

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

  let refElement: SVGGElement;

  onMount(() => {
    // We need to wait for the legend to be rendered before we can compute its size
    // and bind the drag behavior and the mouse enter / leave behavior.
    bindElementsLegend(refElement!, legend);
  });

  createEffect(() => {
    if (refElement! && layer.visible && legend.visible) {
      // TODO
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
    onDblClick={() => {
      makeLegendSettingsModal(legend.id, LL);
    }}
    style={{ cursor: 'grab' }}
  >
    <RectangleBox backgroundRect={legend.backgroundRect}/>
    {makeLegendText(legend.title, [0, 0], 'title')}
    {makeLegendText(legend.subtitle, [0, heightTitle()], 'subtitle')}
  </g>;
}
