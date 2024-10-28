// Imports from solid-js
import {
  createMemo,
  For,
  JSX,
  onMount,
} from 'solid-js';

// Helpers
import { bindDragBehavior, mergeFilterIds } from './common.tsx';
import { Mfloor, Mround } from '../../helpers/math';

// Directives
import bindData from '../../directives/bind-data';

// Stores
import { globalStore } from '../../store/GlobalStore';

// Types / Interfaces / Enums
import { type LayerDescriptionWaffle, WaffleParameters } from '../../global.d';

// For now we keep an array of directives
// because otherwise the import is not detected by the compiler...
const directives = [ // eslint-disable-line @typescript-eslint/no-unused-vars
  bindData,
];

export default function waffleRenderer(
  layerDescription: LayerDescriptionWaffle,
): JSX.Element {
  let refElement: SVGGElement;

  const params: WaffleParameters = layerDescription.rendererParameters;

  onMount(() => {
    refElement.querySelectorAll('g')
      .forEach((groupElement, i) => {
        bindDragBehavior(groupElement as SVGGElement, layerDescription, i);
      });
  });

  return <g
    ref={refElement!}
    id={layerDescription.id}
    class="layer waffle"
    visibility={layerDescription.visible ? undefined : 'hidden'}
    fill-opacity={layerDescription.fillOpacity}
    stroke={layerDescription.strokeColor}
    stroke-width={layerDescription.strokeWidth}
    stroke-opacity={layerDescription.strokeOpacity}
    filter={mergeFilterIds(layerDescription)}
    mgt:geometry-type={layerDescription.type}
    mgt:portrayal-type={layerDescription.representationType}
    mgt:symbol-type={params.symbolType}
    mgt:size={params.size}
    mgt:columns={params.columns}
    mgt:spacing={params.spacing}
  >
    <For each={layerDescription.data.features}>
      {
        (feature) => {
          const projectedCoords = createMemo(
            () => globalStore.projection(feature.geometry.coordinates),
          );

          // Symbols for each variable
          const variableSymbols = params.variables.map((variable) => ({
            ...variable,
            count: Mround(+feature.properties[variable.name] / params.symbolValue),
          }));

          // Central position of the symbol block
          const offsetCentroidX = (
            (params.size + params.spacing) * (params.columns) - (params.size * 1.5));

          let symbolIndex = 0; // Counter for symbol position

          return <g
            // @ts-expect-error because use:bind-data isn't a property of this element
            use:bindData={feature}
          >
            <For each={variableSymbols}>
              {(variable) => <For each={Array.from({ length: variable.count })}>
                  {(_, i) => {
                    const tx = Mround(
                      (symbolIndex % params.columns) * (2 * params.size + params.spacing),
                    );
                    const ty = Mfloor(
                      Mfloor(symbolIndex / params.columns) * (2 * params.size + params.spacing),
                    );
                    symbolIndex += 1; // Increment for next position
                    return params.symbolType === 'circle' ? (
                      <circle
                        cx={projectedCoords()[0] - offsetCentroidX + tx}
                        cy={projectedCoords()[1] - params.size - ty}
                        r={params.size}
                        fill={variable.color}
                      />
                    ) : (
                      <rect
                        x={projectedCoords()[0] - offsetCentroidX + tx}
                        y={projectedCoords()[1] - params.size - ty}
                        width={params.size}
                        height={params.size}
                        fill={variable.color}
                      />
                    );
                  }}
                </For>
              }
            </For>
          </g>;
        }
      }
    </For>
  </g>;
}
