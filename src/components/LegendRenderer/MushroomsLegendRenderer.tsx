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

  const maxRadiusTop = createMemo(
    () => propSizeTop().scale(layer.legend.values.top[layer.legend.values.top.length - 1]),
  );
  const maxRadiusBottom = createMemo(
    () => propSizeBottom().scale(layer.legend.values.bottom[layer.legend.values.bottom.length - 1]),
  );
  const maxRadius = createMemo(() => Mmax(maxRadiusTop(), maxRadiusBottom()));

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

  const sizeTopTitle = createMemo(() => {
    if (!layer.legend.topTitle || !layer.legend.topTitle.text) {
      return 0;
    }
    return getTextSize(
      layer.legend.topTitle.text,
      layer.legend.topTitle.fontSize,
      layer.legend.topTitle.fontFamily,
    ).height;
  });

  const sizeBottomTitle = createMemo(() => {
    if (!layer.legend.bottomTitle || !layer.legend.bottomTitle.text) {
      return 0;
    }
    return getTextSize(
      layer.legend.bottomTitle.text,
      layer.legend.bottomTitle.fontSize,
      layer.legend.bottomTitle.fontFamily,
    ).height;
  });

  const positionNote = createMemo(() => (
    heightTitleSubtitle()
    + maxRadiusTop()
    + sizeTopTitle()
    + sizeBottomTitle()
    + maxRadiusBottom()
    + defaultSpacing * 3
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
            return <>
              <path
                fill={layer.rendererParameters.top.color}
                fill-opacity={layer.fillOpacity}
                stroke={layer.strokeColor}
                stroke-width={layer.strokeWidth}
                d={semiCirclePath(
                  symbolSize,
                  maxRadius(),
                  heightTitleSubtitle() + maxRadiusTop(),
                  'top',
                )}
              >
              </path>
              <text
                font-size={layer.legend.labels.fontSize}
                font-family={layer.legend.labels.fontFamily}
                font-style={layer.legend.labels.fontStyle}
                font-weight={layer.legend.labels.fontWeight}
                fill={layer.legend.labels.fontColor}
                text-anchor="start"
                dominant-baseline="middle"
                style={{ 'user-select': 'none' }}
                x={maxRadius() * 2 + defaultSpacing * 2}
                y={heightTitleSubtitle() + maxRadiusTop() - symbolSize}
              >{
                round(value, layer.legend!.roundDecimals)
                  .toLocaleString(
                    applicationSettingsStore.userLocale,
                    {
                      minimumFractionDigits: precisionToMinimumFractionDigits(
                        layer.legend!.roundDecimals,
                      ),
                    },
                  )
              }</text>
              <line
                stroke-width={0.8}
                stroke-dasharray="2"
                stroke="black"
                x1={maxRadius()}
                y1={heightTitleSubtitle() + maxRadiusTop() - symbolSize}
                x2={maxRadius() * 2 + defaultSpacing * 2}
                y2={heightTitleSubtitle() + maxRadiusTop() - symbolSize}
              ></line>
            </>;
          }
        }
      </For>
      {
        makeLegendText(
          layer.legend.topTitle,
          [maxRadius(), heightTitleSubtitle() + maxRadiusTop() + defaultSpacing],
          'top-title',
          { 'text-anchor': 'middle' },
        )
      }
      {
        makeLegendText(
          layer.legend.bottomTitle,
          [maxRadius(), heightTitleSubtitle() + maxRadiusTop() + defaultSpacing + sizeTopTitle()],
          'bottom-title',
          { 'text-anchor': 'middle' },
        )
      }
      <For each={layer.legend.values.bottom.toReversed()}>
        {
          (value) => {
            const symbolSize = propSizeBottom().scale(value);
            return <>
              <path
                fill={layer.rendererParameters.bottom.color}
                fill-opacity={layer.fillOpacity}
                stroke={layer.strokeColor}
                stroke-width={layer.strokeWidth}
                d={semiCirclePath(
                  symbolSize,
                  maxRadius(),
                  (heightTitleSubtitle()
                    + maxRadiusTop()
                    + sizeTopTitle()
                    + sizeBottomTitle()
                    + defaultSpacing),
                  'bottom',
                )}
              ></path>
              <text
                font-size={layer.legend.labels.fontSize}
                font-family={layer.legend.labels.fontFamily}
                font-style={layer.legend.labels.fontStyle}
                font-weight={layer.legend.labels.fontWeight}
                fill={layer.legend.labels.fontColor}
                text-anchor="start"
                dominant-baseline="middle"
                style={{ 'user-select': 'none' }}
                x={maxRadius() * 2 + defaultSpacing * 2}
                y={
                  heightTitleSubtitle()
                  + maxRadiusTop()
                  + sizeTopTitle()
                  + sizeBottomTitle()
                  + defaultSpacing
                  + maxRadiusBottom()
                  - (maxRadiusBottom() - symbolSize)
                }
              >{
                round(value, layer.legend!.roundDecimals)
                  .toLocaleString(
                    applicationSettingsStore.userLocale,
                    {
                      minimumFractionDigits: precisionToMinimumFractionDigits(
                        layer.legend!.roundDecimals,
                      ),
                    },
                  )
              }</text>
              <line
                stroke-width={0.8}
                stroke-dasharray="2"
                stroke="black"
                x1={maxRadius()}
                y1={
                  heightTitleSubtitle()
                  + maxRadiusTop()
                  + sizeTopTitle()
                  + sizeBottomTitle()
                  + defaultSpacing
                  + maxRadiusBottom()
                  - (maxRadiusBottom() - symbolSize)
                }
                x2={maxRadius() * 2 + defaultSpacing * 2}
                y2={
                  heightTitleSubtitle()
                  + maxRadiusTop()
                  + sizeTopTitle()
                  + sizeBottomTitle()
                  + defaultSpacing
                  + maxRadiusBottom()
                  - (maxRadiusBottom() - symbolSize)
                }
              ></line>
            </>;
          }
        }
      </For>
    </g>
    {makeLegendText(layer.legend.note, [0, positionNote()], 'note')}
  </g>;
}
