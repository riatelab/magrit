// Imports from solid-js
import {
  createMemo,
  For,
  JSX,
  Show,
} from 'solid-js';

// Helpers
import { unproxify } from '../../helpers/common';
import { PropSizer } from '../../helpers/geo';

// Directives
import bindData from '../../directives/bind-data';

// Stores
import { globalStore } from '../../store/GlobalStore';
import { applicationSettingsStore, RenderVisibility } from '../../store/ApplicationSettingsStore';

// Types / Interfaces / Enums
import {
  LayerDescriptionProportionalSymbols,
  ProportionalSymbolsParameters,
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
  // Will scale the symbols according to the value of the variable
  const propSize = createMemo(() => new PropSizer(
    layerDescription.rendererParameters.referenceValue,
    layerDescription.rendererParameters.referenceRadius,
    layerDescription.rendererParameters.symbolType,
  ));

  return <Show when={
    applicationSettingsStore.renderVisibility === RenderVisibility.RenderAsHidden
    || layerDescription.visible
  }>
    <g
      id={layerDescription.id}
      class="layer proportional-symbols"
      visibility={layerDescription.visible ? undefined : 'hidden'}
      fill-opacity={layerDescription.fillOpacity}
      stroke={layerDescription.strokeColor}
      stroke-width={layerDescription.strokeWidth}
      stroke-opacity={layerDescription.strokeOpacity}
      stroke-linecap="round"
      stroke-linejoin="round"
      filter={layerDescription.dropShadow ? `url(#filter-drop-shadow-${layerDescription.id})` : undefined}
    >
      <For each={layerDescription.data.features}>
        {
          (feature) => {
            const projectedCoords = globalStore.projection(feature.geometry.coordinates);
            if (
              layerDescription.rendererParameters.symbolType
              === ProportionalSymbolsSymbolType.circle
            ) {
              return <circle
                r={propSize().scale(
                  feature.properties[layerDescription.rendererParameters.variable],
                )}
                cx={projectedCoords[0]}
                cy={projectedCoords[1]}
                fill={layerDescription.rendererParameters.color as string}
                use:bindData={unproxify(feature)}
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
                x={projectedCoords[0] - symbolSize() / 2}
                y={projectedCoords[1] - symbolSize() / 2}
                fill={layerDescription.rendererParameters.color as string}
                use:bindData={unproxify(feature)}
              ></rect>;
            }
            return null;
          }
        }
      </For>
    </g>
  </Show>;
}
