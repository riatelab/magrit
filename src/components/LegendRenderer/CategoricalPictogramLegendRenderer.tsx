// Imports from solid-js
import {
  createEffect, createMemo,
  For, JSX, onMount,
} from 'solid-js';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { isNonNull } from '../../helpers/common';
import { findLayerById } from '../../helpers/layers';
import { sum } from '../../helpers/math';
import {
  bindElementsLegend, computeRectangleBox,
  getTextSize,
  makeLegendSettingsModal,
  makeLegendText,
  RectangleBox,
  triggerContextMenuLegend,
} from './common.tsx';
import { setWidthHeight } from '../../helpers/sanitize-svg';

// Stores
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';
import { layersDescriptionStore } from '../../store/LayersDescriptionStore';

// Types / Interfaces / Enums
import {
  type CategoricalPictogramLegend,
  type CategoricalPictogramMapping,
  type LayerDescriptionCategoricalPictogram,
} from '../../global.d';

const defaultSpacing = applicationSettingsStore.defaultLegendSettings.spacing;

export default function legendCategoricalPictogram(
  legend: CategoricalPictogramLegend,
): JSX.Element {
  let refElement: SVGGElement;
  const { LL } = useI18nContext();
  const layer = findLayerById(
    layersDescriptionStore.layers,
    legend.layerId,
  ) as LayerDescriptionCategoricalPictogram;

  const mapping = createMemo(
    () => layer.rendererParameters.mapping.filter((m) => isNonNull(m.value)),
  );

  const heightTitle = () => {
    const titleSize = getTextSize(
      legend.title.text,
      legend.title.fontSize,
      legend.title.fontFamily,
    );
    return titleSize.height + defaultSpacing;
  };

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

  const positionNote = createMemo(() => (
    heightTitleSubtitle() // The size necessary for the title and subtitle
    + ( // The size for all the icons and the spacing between them
      sum(mapping().map((d) => d.iconDimension[1] + legend.spacing))
      - legend.spacing
    )
    + defaultSpacing * 2 // space between the last icon and the note
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
        legend.subtitle.text,
        legend.note.text,
        legend.spacing,
        layer.rendererParameters.mapping,
      );
    }
  });

  return <g
    ref={refElement!}
    id={legend.id}
    class="legend categoricalPictogram"
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
    {makeLegendText(legend.title, [0, 0], 'title')}
    {makeLegendText(legend.subtitle, [0, heightTitle()], 'subtitle')}
    <g class="legend-content">
      <For each={mapping()}>
        {
          (item, i) => {
            if (item.iconType === 'SVG') {
              return <>
                <g
                  transform={`translate(0, ${heightTitleSubtitle() + (i() === 0 ? 0 : sum(
                    mapping()
                      .slice(0, i())
                      .map((d: CategoricalPictogramMapping) => d.iconDimension[1] + legend.spacing),
                  ))})`}
                  // eslint-disable-next-line solid/no-innerhtml
                  innerHTML={
                    setWidthHeight(item.iconContent, item.iconDimension[0], item.iconDimension[1])
                  }
                />
                <text
                  font-size={`${legend.labels.fontSize}px`}
                  font-family={legend.labels.fontFamily}
                  font-style={legend.labels.fontStyle}
                  font-weight={legend.labels.fontWeight}
                  fill={legend.labels.fontColor}
                  text-anchor="start"
                  dominant-baseline="middle"
                  x={60}
                  y={heightTitleSubtitle() + item.iconDimension[1] / 2 + (i() === 0 ? 0 : sum(
                    mapping().slice(0, i())
                      .map((d: CategoricalPictogramMapping) => d.iconDimension[1] + legend.spacing),
                  ))}
                >{item.categoryName}</text>
              </>;
            }
            return <>
              <g
                transform={`translate(0, ${heightTitleSubtitle() + item.iconDimension[1] / 2 + (i() === 0 ? 0 : sum(
                  mapping().slice(0, i())
                    .map((d: CategoricalPictogramMapping) => d.iconDimension[1] + legend.spacing),
                ))})`}
              >
                <image
                  width={item.iconDimension[0]}
                  height={item.iconDimension[1]}
                  href={item.iconContent}
                />
                <text
                  font-size={`${legend.labels.fontSize}px`}
                  font-family={legend.labels.fontFamily}
                  font-style={legend.labels.fontStyle}
                  font-weight={legend.labels.fontWeight}
                  fill={legend.labels.fontColor}
                  text-anchor="start"
                  dominant-baseline="middle"
                  x={60}
                  y={heightTitleSubtitle() + (i() === 0 ? 0 : sum(
                    mapping().slice(0, i())
                      .map((d: CategoricalPictogramMapping) => d.iconDimension[1] + legend.spacing),
                  ))}
                >{item.categoryName}</text>
              </g>
            </>;
          }
        }
      </For>
    </g>
    {makeLegendText(legend.note, [0, positionNote()], 'note')}
  </g>;
}
