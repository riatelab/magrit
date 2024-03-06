// Imports from solid-js
import {
  createEffect,
  createMemo,
  For,
  type JSX,
  onMount,
} from 'solid-js';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { PropSizer } from '../../helpers/geo';
import { Mmax, round, sum } from '../../helpers/math';
import { precisionToMinimumFractionDigits } from '../../helpers/common';
import { semiCirclePath } from '../../helpers/svg';

// Sub-components
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

// Types / Interfaces / Enums
import type {
  LayerDescriptionMushroomLayer,
  MushroomsLegendParameters,
  MushroomsParameters,
} from '../../global';

const defaultSpacing = applicationSettingsStore.defaultLegendSettings.spacing;

export default function legendMushrooms(
  layer: LayerDescriptionMushroomLayer,
): JSX.Element {
  let refElement: SVGGElement;
  const { LL } = useI18nContext();

  const propSizeTop = createMemo(() => new PropSizer(
    layer.rendererParameters.top.referenceValue,
    layer.rendererParameters.top.referenceSize,
    layer.rendererParameters.top.symbolType,
  ));

  const propSizeBottom = createMemo(() => new PropSizer(
    layer.rendererParameters.bottom.referenceValue,
    layer.rendererParameters.bottom.referenceSize,
    layer.rendererParameters.bottom.symbolType,
  ));

  // TODO: compute the max radius instead of using the reference size
  const maxRadiusTop = createMemo(() => layer.rendererParameters.top.referenceSize);
  const maxRadiusBottom = createMemo(() => layer.rendererParameters.bottom.referenceSize);

  const heightTitle = createMemo(
    () => getTextSize(
      layer.legend.title.text,
      layer.legend.title.fontSize,
      layer.legend.title.fontFamily,
    ).height + defaultSpacing,
  );

  const heightTitleSubtitle = createMemo(() => {
    if (!layer.legend?.subtitle || layer.legend?.subtitle.text) {
      return heightTitle();
    }
    return heightTitle() + getTextSize(
      layer.legend.subtitle.text,
      layer.legend.subtitle.fontSize,
      layer.legend.subtitle.fontFamily,
    ).height + defaultSpacing;
  });

  const positionNote = createMemo(() => (
    heightTitleSubtitle()
    + maxRadiusTop()
    + maxRadiusBottom()
    + defaultSpacing * 2
  ));

  onMount(() => {
    bindElementsLegend(refElement, layer);
  });

  createEffect(() => {
    if (refElement && layer.visible && layer.legend.visible) {
      computeRectangleBox(
        refElement,
        heightTitle(),
        heightTitleSubtitle(),
        positionNote(),
        layer.legend.title.text,
        layer.legend?.subtitle?.text,
        layer.legend?.note?.text,
        layer.legend.roundDecimals,
      );
    }
  });

  return <g
    ref={refElement!}
    class="legend mushrooms"
    for={layer.id}
    transform={`translate(${layer.legend?.position[0]}, ${layer.legend?.position[1]})`}
    visibility={layer.visible && layer.legend.visible ? undefined : 'hidden'}
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLegend(e, layer.id, LL);
    }}
    onDblClick={(e) => { makeLegendSettingsModal(layer.id, LL); }}
  >
    <RectangleBox backgroundRect={layer.legend.backgroundRect} />
    { makeLegendText(layer.legend.title, [0, 0], 'title') }
    { makeLegendText(layer.legend?.subtitle, [0, heightTitle()], 'subtitle') }
    <g class="legend-content">
      <For each={layer.legend.values.top.toReversed()}>
        {
          (value) => {
            const symbolSize = propSizeTop().scale(value);
            return <path
              fill={layer.rendererParameters.top.color}
              fill-opacity={layer.fillOpacity}
              stroke={layer.strokeColor}
              stroke-width={layer.strokeWidth}
              d={semiCirclePath(
                symbolSize,
                maxRadiusTop(),
                heightTitleSubtitle() + maxRadiusTop(),
                'top',
              )}
            >
            </path>;
          }
        }
      </For>
      <For each={layer.legend.values.bottom.toReversed()}>
        {
          (value) => {
            const symbolSize = propSizeBottom().scale(value);
            return <path
              fill={layer.rendererParameters.bottom.color}
              fill-opacity={layer.fillOpacity}
              stroke={layer.strokeColor}
              stroke-width={layer.strokeWidth}
              d={semiCirclePath(
                symbolSize,
                maxRadiusTop(),
                heightTitleSubtitle() + maxRadiusTop(),
                'bottom',
              )}
            ></path>;
          }
        }
      </For>
    </g>
    {makeLegendText(layer.legend.note, [0, positionNote()], 'note')}
  </g>;
}
