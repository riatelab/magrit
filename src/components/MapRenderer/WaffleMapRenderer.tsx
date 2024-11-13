// Imports from solid-js
import {
  createMemo,
  For,
  JSX,
  onMount,
} from 'solid-js';

// Helpers
import { bindDragBehavior, mergeFilterIds } from './common.tsx';
import {
  Mfloor, Mmin, Mround, Msqrt,
} from '../../helpers/math';

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
    mgt:horizontalAnchor={params.horizontalAnchor}
    mgt:verticalAnchor={params.verticalAnchor}
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

          const totalSymbols = variableSymbols.reduce((acc, variable) => acc + variable.count, 0);

          // If the number of symbols is less than the number of columns,
          // we use the number of symbols
          // so the waffle is centered correctly around the few symbols
          const columns = params.columns.type === 'fixed'
            ? Mmin(params.columns.value, totalSymbols)
            : Mmin(Mround(Msqrt(totalSymbols)), totalSymbols);

          // Central position of the symbol block (on the x-axis)
          let offsetCentroidX = 0; // value for anchor = 'start'

          if (params.symbolType === 'circle') {
            if (params.horizontalAnchor === 'middle') {
              offsetCentroidX = (params.size + params.spacing)
                * (columns / 2) - (params.size * 0.5);
            } else if (params.horizontalAnchor === 'end') {
              offsetCentroidX = (params.size + params.spacing) * columns - params.size;
            }
          } else { // eslint-disable-next-line no-lonely-if
            if (params.horizontalAnchor === 'middle') {
              offsetCentroidX = (params.size + params.spacing) * (columns / 2);
            } else if (params.horizontalAnchor === 'end') {
              offsetCentroidX = (params.size + params.spacing) * columns;
            }
          }

          // Central position of the symbol block (on the y-axis)
          let offsetCentroidY = 0; // value for verticalAnchor = 'bottom'

          if (params.symbolType === 'circle') {
            if (params.verticalAnchor === 'middle') {
              offsetCentroidY = (params.size + params.spacing) * (Mfloor(
                totalSymbols / columns,
              ) / 2);
            } else if (params.verticalAnchor === 'top') {
              offsetCentroidY = (params.size + params.spacing) * Mfloor(totalSymbols / columns);
            }
          } else { // eslint-disable-next-line no-lonely-if
            if (params.verticalAnchor === 'middle') {
              offsetCentroidY = (params.size + params.spacing) * (Mfloor(
                totalSymbols / columns,
              ) / 2);
            } else if (params.verticalAnchor === 'top') {
              offsetCentroidY = (params.size + params.spacing) * Mfloor(totalSymbols / columns);
            }
          }

          let symbolIndex = 0; // Counter for symbol position

          return <g
            // @ts-expect-error because use:bind-data isn't a property of this element
            use:bindData={feature}
            mgt:columns={columns}
            mgt:totalSymbols={totalSymbols}
          >
            <For each={variableSymbols}>
              {(variable) => <For each={Array.from({ length: variable.count })}>
                  {() => {
                    const tx = Mround(
                      (symbolIndex % columns) * (params.size + params.spacing),
                    );
                    const ty = Mfloor(
                      Mfloor(symbolIndex / columns) * (params.size + params.spacing),
                    );
                    symbolIndex += 1; // Increment for next position
                    return params.symbolType === 'circle' ? (
                      <circle
                        cx={projectedCoords()[0] - offsetCentroidX + tx}
                        cy={projectedCoords()[1] + offsetCentroidY - (params.size / 2) - ty}
                        r={params.size / 2}
                        fill={variable.color}
                      />
                    ) : (
                      <rect
                        x={projectedCoords()[0] - offsetCentroidX + tx}
                        y={projectedCoords()[1] + offsetCentroidY - params.size - ty}
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
