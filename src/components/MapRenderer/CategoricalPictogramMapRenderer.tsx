// Imports from solid-js
import { createMemo, For, JSX } from 'solid-js';

// Helpers
import { mergeFilterIds } from './common.tsx';
import { setWidthHeight } from '../../helpers/sanitize-svg';

// Directives
import bindData from '../../directives/bind-data';

// Stores
import { globalStore } from '../../store/GlobalStore';

// Types / Interfaces / Enums
import { type LayerDescriptionCategoricalPictogram } from '../../global.d';

// For now we keep an array of directives
// because otherwise the import is not detected by the compiler...
const directives = [ // eslint-disable-line @typescript-eslint/no-unused-vars
  bindData,
];

type CategoricalPictoMapK = string | number | null | undefined;
type CategoricalPictoMapV = [string, string, [number, number]] | null;

export default function categoricalPictogramRenderer(
  layerDescription: LayerDescriptionCategoricalPictogram,
): JSX.Element {
  let refElement: SVGGElement;

  const symbolMap = createMemo(
    () => {
      const map = new Map<CategoricalPictoMapK, CategoricalPictoMapV>(
        layerDescription.rendererParameters.mapping
          .map(({
            value,
            iconContent,
            iconType,
            iconDimension,
          }) => [value, [iconType, iconContent, iconDimension]]),
      );
      map.set('', null);
      map.set(null, null);
      map.set(undefined, null);
      return map;
    },
  );

  const noShow = createMemo(
    () => new Set(layerDescription.rendererParameters.mapping
      .filter((m) => !m.show)
      .map((m) => m.value)),
  );

  return <g
    ref={refElement!}
    id={layerDescription.id}
    classList={{
      layer: true,
      categoricalPictogram: true,
      // movable: layerDescription.rendererParameters.movable,
    }}
    visibility={layerDescription.visible ? undefined : 'hidden'}
    fill-opacity={layerDescription.fillOpacity}
    stroke={layerDescription.strokeColor}
    stroke-width={layerDescription.strokeWidth}
    stroke-opacity={layerDescription.strokeOpacity}
    stroke-linecap="round"
    stroke-linejoin="round"
    filter={mergeFilterIds(layerDescription)}
    mgt:geometry-type={layerDescription.type}
    mgt:portrayal-type={layerDescription.representationType}
  >
    <For each={
      layerDescription.data.features
        .filter((ft) => !noShow()
          .has(ft.properties[layerDescription.rendererParameters.variable]))
    }>
      {
        (feature) => {
          const icon = createMemo(() => symbolMap()
            .get(feature.properties[layerDescription.rendererParameters.variable]));
          if (!icon()) return <></>;
          const projectedCoords = createMemo(
            () => globalStore.projection(feature.geometry.coordinates)
              .map((d, i) => d - icon()![2][i] / 2),
          );
          if (icon()![0] === 'SVG') {
            return <g
              transform={`translate(${projectedCoords()[0]}, ${projectedCoords()[1]})`}
              mgt:icon-dimension={JSON.stringify(icon()![2])}
              // @ts-expect-error because use:bind-data isn't a property of this element
              use:bindData={feature}
              // eslint-disable-next-line solid/no-innerhtml
              innerHTML={setWidthHeight(icon()![1], icon()![2][0], icon()![2][1])}
            />;
          }
          return <g
            transform={`translate(${projectedCoords()[0]}, ${projectedCoords()[1]})`}
            mgt:icon-dimension={JSON.stringify(icon()![2])}
            // @ts-expect-error because use:bind-data isn't a property of this element
            use:bindData={feature}
          >
            <image width={icon()![2][0]} height={icon()![2][1]} href={icon()![1]}/>
          </g>;
        }
      }
    </For>
  </g>;
}
