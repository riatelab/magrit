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
import { precisionToMinimumFractionDigits } from '../../helpers/common';
import { PropSizer } from '../../helpers/geo';
import { findLayerById } from '../../helpers/layers';
import { Mmax, round } from '../../helpers/math';
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
import { layersDescriptionStore } from '../../store/LayersDescriptionStore';

// Types / Interfaces / Enums
import type {
  LayerDescriptionMushroomLayer,
  MushroomsLegend,
} from '../../global';

const defaultSpacing = applicationSettingsStore.defaultLegendSettings.spacing;

export default function legendMushrooms(
  legend: MushroomsLegend,
): JSX.Element {
  let refElement: SVGGElement;
  const { LL } = useI18nContext();
  const layer = findLayerById(
    layersDescriptionStore.layers,
    legend.layerId,
  )! as LayerDescriptionMushroomLayer;

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
    () => propSizeTop().scale(legend.values.top[legend.values.top.length - 1]),
  );
  const maxRadiusBottom = createMemo(
    () => propSizeBottom().scale(legend.values.bottom[legend.values.bottom.length - 1]),
  );
  const maxRadius = createMemo(() => Mmax(maxRadiusTop(), maxRadiusBottom()));

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

  const sizeTopTitle = createMemo(() => {
    if (!legend.topTitle || !legend.topTitle.text) {
      return 0;
    }
    return getTextSize(
      legend.topTitle.text,
      legend.topTitle.fontSize,
      legend.topTitle.fontFamily,
    ).height;
  });

  const sizeBottomTitle = createMemo(() => {
    if (!legend.bottomTitle || !legend.bottomTitle.text) {
      return 0;
    }
    return getTextSize(
      legend.bottomTitle.text,
      legend.bottomTitle.fontSize,
      legend.bottomTitle.fontFamily,
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
    bindElementsLegend(refElement, legend);
  });

  createEffect(() => {
    if (refElement && layer.visible && legend.visible) {
      computeRectangleBox(
        refElement,
        heightTitle(),
        heightTitleSubtitle(),
        positionNote(),
        legend.title.text,
        legend.subtitle?.text,
        legend.note?.text,
        legend.roundDecimals,
      );
    }
  });

  return <g
    ref={refElement!}
    class="legend mushrooms"
    for={layer.id}
    transform={`translate(${legend.position[0]}, ${legend.position[1]})`}
    visibility={layer.visible && legend.visible ? undefined : 'hidden'}
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLegend(e, legend.id, LL);
    }}
    onDblClick={(e) => { makeLegendSettingsModal(legend.id, LL); }}
  >
    <RectangleBox backgroundRect={legend.backgroundRect} />
    { makeLegendText(legend.title, [0, 0], 'title') }
    { makeLegendText(legend.subtitle, [0, heightTitle()], 'subtitle') }
    <g class="legend-content">
      <For each={legend.values.top.toReversed()}>
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
                font-size={legend.labels.fontSize}
                font-family={legend.labels.fontFamily}
                font-style={legend.labels.fontStyle}
                font-weight={legend.labels.fontWeight}
                fill={legend.labels.fontColor}
                text-anchor="start"
                dominant-baseline="middle"
                style={{ 'user-select': 'none' }}
                x={maxRadius() * 2 + defaultSpacing * 2}
                y={heightTitleSubtitle() + maxRadiusTop() - symbolSize}
              >{
                round(value, legend.roundDecimals)
                  .toLocaleString(
                    applicationSettingsStore.userLocale,
                    {
                      minimumFractionDigits: precisionToMinimumFractionDigits(
                        legend.roundDecimals,
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
          legend.topTitle,
          [maxRadius(), heightTitleSubtitle() + maxRadiusTop() + defaultSpacing],
          'top-title',
          { 'text-anchor': 'middle' },
        )
      }
      {
        makeLegendText(
          legend.bottomTitle,
          [maxRadius(), heightTitleSubtitle() + maxRadiusTop() + defaultSpacing + sizeTopTitle()],
          'bottom-title',
          { 'text-anchor': 'middle' },
        )
      }
      <For each={legend.values.bottom.toReversed()}>
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
                font-size={legend.labels.fontSize}
                font-family={legend.labels.fontFamily}
                font-style={legend.labels.fontStyle}
                font-weight={legend.labels.fontWeight}
                fill={legend.labels.fontColor}
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
                round(value, legend.roundDecimals)
                  .toLocaleString(
                    applicationSettingsStore.userLocale,
                    {
                      minimumFractionDigits: precisionToMinimumFractionDigits(
                        legend.roundDecimals,
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
    {makeLegendText(legend.note, [0, positionNote()], 'note')}
  </g>;
}
