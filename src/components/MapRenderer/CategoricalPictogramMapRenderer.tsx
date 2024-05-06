// Imports from solid-js
import { createMemo, For, JSX } from 'solid-js';

// Helpers
import { mergeFilterIds } from './common.tsx';

// Directives
import bindData from '../../directives/bind-data';

import { globalStore } from '../../store/GlobalStore';

import { CategoricalPictogramParameters, LayerDescriptionCategoricalPictogram } from '../../global';

const createCustomViewBox = (content: string): string | undefined => {
  const width = content.match(/width="(\d+(\.\d+)?)"/)?.[1];
  const height = content.match(/height="(\d+(\.\d+)?)"/)?.[1];
  return (width && height) ? `0 0 ${width} ${height}` : undefined;
};

// For now we keep an array of directives
// because otherwise the import is not detected by the compiler...
const directives = [ // eslint-disable-line @typescript-eslint/no-unused-vars
  bindData,
];

export default function categoricalPictogramRenderer(
  layerDescription: LayerDescriptionCategoricalPictogram,
): JSX.Element {
  let refElement: SVGGElement;
  const rendererParameters = layerDescription.rendererParameters as CategoricalPictogramParameters;

  const symbolMap = createMemo(
    () => new Map<string | number | null | undefined, [string, string, [number, number]]>(
      rendererParameters.mapping
        .map(({
          value,
          iconContent,
          iconType,
          iconDimension,
        }) => [value, [iconType, iconContent, iconDimension]]),
    ),
  );

  return <g
    ref={refElement!}
    id={layerDescription.id}
    class="layer categoricalPictogram"
    visibility={layerDescription.visible ? undefined : 'hidden'}
    fill-opacity={layerDescription.fillOpacity}
    stroke={layerDescription.strokeColor}
    stroke-width={layerDescription.strokeWidth}
    stroke-opacity={layerDescription.strokeOpacity}
    stroke-linecap="round"
    stroke-linejoin="round"
    filter={mergeFilterIds(layerDescription)}
    mgt:geometry-type={layerDescription.type}
    mgt:portrayal-type={layerDescription.renderer}
  >
    <For each={layerDescription.data.features}>
      {
        (feature) => {
          const projectedCoords = createMemo(
            () => globalStore.projection(feature.geometry.coordinates),
          );
          const icon = symbolMap().get(feature.properties[rendererParameters.variable]);
          if (!icon) return <></>;
          if (icon[0] === 'SVG') {
            return <g
              transform={`translate(${projectedCoords()[0] - icon[2][0] / 2}, ${projectedCoords()[1] - icon[2][1] / 2})`}
              mgt:icon-dimension={JSON.stringify(icon[2])}
              // @ts-expect-error because use:bind-data isn't a property of this element
              use:bindData={feature}
              // eslint-disable-next-line solid/no-innerhtml
              innerHTML={icon[1].replace('<svg ', `<svg width="${icon[2][0]}" height="${icon[2][1]}"`)}
            />;
          }
          return <g
            transform={`translate(${projectedCoords()[0] - icon[2][0] / 2}, ${projectedCoords()[1] - icon[2][1] / 2})`}
            mgt:icon-dimension={JSON.stringify(icon[2])}
            // @ts-expect-error because use:bind-data isn't a property of this element
            use:bindData={feature}
          >
            <image width={icon[2][0]} height={icon[2][1]} href={icon[1]}/>
          </g>;
        }
      }
    </For>
  </g>;
}
