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
import { type LayerDescriptionWaffle } from '../../global.d';

// For now we keep an array of directives
// because otherwise the import is not detected by the compiler...
const directives = [ // eslint-disable-line @typescript-eslint/no-unused-vars
  bindData,
];

export default function waffleRenderer(
  layerDescription: LayerDescriptionWaffle,
): JSX.Element {
  let refElement: SVGGElement;

  const params = layerDescription.rendererParameters;

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
  >
    <For each={layerDescription.data.features}>
      {
        (feature) => {
          const projectedCoords = createMemo(
            () => globalStore.projection(feature.geometry.coordinates),
          );
          const sum = params.variables.reduce(
            (acc, v) => acc + Mround(+feature.properties[v.name] / params.symbolValue),
            0,
          );
          if (params.symbolType === 'circle') {
            const offsetCentroidX = (
              params.spacing + (2 * params.size * params.columns)) / 2 - params.size;
            return <g>
              <For each={Array.from({ length: sum })}>
                {(_, i) => {
                  const tx = Mround((i() % params.columns) * (2 * params.size + params.spacing));
                  const ty = Mfloor(
                    Mfloor(i() / params.columns) * (2 * params.size + params.spacing),
                  );
                  return <circle
                    cx={projectedCoords()[0] + offsetCentroidX + tx}
                    cy={projectedCoords()[1] - params.size + ty}
                    r={params.size}
                    fill={'blue'}
                  />;
                }}
              </For>
            </g>;
          } else { // eslint-disable-line no-else-return
            const offsetCentroidX = (
              (params.size + params.spacing) * (params.columns - 1) - params.size) / 2;
            return <g>
              <For each={Array.from({ length: sum })}>
                {(_, i) => {
                  const tx = Mround((i() % params.columns) * (params.size + params.spacing));
                  const ty = Mfloor(Mfloor(i() / params.columns) * (params.size + params.spacing));
                  return <rect
                    x={projectedCoords()[0] + offsetCentroidX + tx}
                    y={projectedCoords()[1] - params.size + ty}
                    width={params.size}
                    height={params.size}
                    fill={'blue'}
                  />;
                }}
              </For>
            </g>;
          }
        }
      }
    </For>
  </g>;
}
