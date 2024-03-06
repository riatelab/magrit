// Imports from solid-js
import {
  createMemo,
  For,
  JSX,
  onMount,
} from 'solid-js';

// Helpers
import { PropSizer } from '../../helpers/geo';
import { bindDragBehavior, mergeFilterIds } from './common.tsx';

// Directives
import bindData from '../../directives/bind-data';

// Stores
import { globalStore } from '../../store/GlobalStore';

// Types / Interfaces / Enums
import {
  LayerDescriptionProportionalSymbols,
  ProportionalSymbolsSymbolType,
} from '../../global.d';

// For now we keep an array of directives
// because otherwise the import is not detected by the compiler...
const directives = [ // eslint-disable-line @typescript-eslint/no-unused-vars
  bindData,
];

export default function proportionalSymbolsRenderer(
  layerDescription: LayerDescriptionProportionalSymbols,
): JSX.Element {
  let refElement: SVGGElement;
  // Will scale the symbols according to the value of the variable
  const propSize = createMemo(() => new PropSizer(
    layerDescription.rendererParameters.referenceValue,
    layerDescription.rendererParameters.referenceRadius,
    layerDescription.rendererParameters.symbolType,
  ));

  onMount(() => {
    refElement.querySelectorAll('circle, rect')
      .forEach((symbolElement, i) => {
        bindDragBehavior(symbolElement as SVGGElement, layerDescription, i);
      });
  });

  return <g
    ref={refElement!}
    id={layerDescription.id}
    class="layer proportionalSymbols"
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
          if (
            layerDescription.rendererParameters.symbolType
            === ProportionalSymbolsSymbolType.circle
          ) {
            return <circle
              r={propSize().scale(
                feature.properties[layerDescription.rendererParameters.variable],
              )}
              cx={projectedCoords()[0]}
              cy={projectedCoords()[1]}
              fill={layerDescription.rendererParameters.color as string}
              use:bindData={feature}
            ></circle>;
          }
          if (
            layerDescription.rendererParameters.symbolType
            === ProportionalSymbolsSymbolType.square
          ) {
            const symbolSize = createMemo(() => propSize().scale(
              feature.properties[layerDescription.rendererParameters.variable],
            ));
            return <rect
              width={symbolSize()}
              height={symbolSize()}
              x={projectedCoords()[0] - symbolSize() / 2}
              y={projectedCoords()[1] - symbolSize() / 2}
              fill={layerDescription.rendererParameters.color as string}
              use:bindData={feature}
            ></rect>;
          }
          return null;
        }
      }
    </For>
  </g>;
}
