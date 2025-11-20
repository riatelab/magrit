// Imports from solid-js
import {
  createMemo,
  For,
  JSX,
  onMount,
} from 'solid-js';

// GeoJSON Types
import type { Point } from 'geojson';

// Helpers
import { PropSizer } from '../../helpers/geo';
import { bindDragBehavior, mergeFilterIds } from './common.tsx';
import { semiCirclePath } from '../../helpers/svg';

// Directives
import bindData from '../../directives/bind-data';

// Stores
import { globalStore } from '../../store/GlobalStore';

// Types / Interfaces / Enums
import {
  type LayerDescriptionMushroomLayer,
} from '../../global.d';

// For now we keep an array of directives
// because otherwise the import is not detected by the compiler...
const directives = [ // eslint-disable-line @typescript-eslint/no-unused-vars
  bindData,
];

export default function mushroomRenderer(
  layerDescription: LayerDescriptionMushroomLayer,
): JSX.Element {
  let refElement: SVGGElement;
  // Will scale the symbols according to the value of the variable
  const propSizeTop = createMemo(() => new PropSizer(
    layerDescription.rendererParameters.top.referenceValue,
    layerDescription.rendererParameters.top.referenceSize,
    layerDescription.rendererParameters.top.symbolType,
  ));

  // Will scale the symbols according to the value of the variable
  const propSizeBottom = createMemo(() => new PropSizer(
    layerDescription.rendererParameters.bottom.referenceValue,
    layerDescription.rendererParameters.bottom.referenceSize,
    layerDescription.rendererParameters.bottom.symbolType,
  ));

  onMount(() => {
    refElement!.querySelectorAll('g')
      .forEach((symbolElement, i) => {
        bindDragBehavior(symbolElement as SVGGElement, layerDescription, i);
      });
  });

  return <g
    ref={refElement!}
    id={layerDescription.id}
    class="layer mushrooms"
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
    <For each={layerDescription.data.features}>
      {
        (feature) => {
          const projectedCoords = createMemo(
            () => globalStore.projection((feature.geometry as Point).coordinates),
          );
          const sizeTop = createMemo(() => propSizeTop().scale(
            feature.properties![layerDescription.rendererParameters.top.variable],
          ));
          const sizeBottom = createMemo(() => propSizeBottom().scale(
            feature.properties![layerDescription.rendererParameters.bottom.variable],
          ));
          return <g
            // @ts-expect-error because use:bind-data isn't a property of this element
            use:bindData={feature}
          >
            <path
              fill={layerDescription.rendererParameters.top.color}
              mgt:size-value={sizeTop()}
              d={
                semiCirclePath(
                  sizeTop(),
                  projectedCoords()[0],
                  projectedCoords()[1],
                  'top',
                )
              }
              // @ts-expect-error because use:bind-data isn't a property of this element
              use:bindData={feature}
            ></path>
            <path
              fill={layerDescription.rendererParameters.bottom.color}
              mgt:size-value={sizeBottom()}
              d={
                semiCirclePath(
                  sizeBottom(),
                  projectedCoords()[0],
                  projectedCoords()[1],
                  'bottom',
                )
              }
              // @ts-expect-error because use:bind-data isn't a property of this element
              use:bindData={feature}
            ></path>
          </g>;
        }
      }
    </For>
  </g>;
}
