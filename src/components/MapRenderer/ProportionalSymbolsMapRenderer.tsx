// Imports from solid-js
import { For, JSX, Show } from 'solid-js';

// Helpers
import { unproxify } from '../../helpers/common';
import { PropSizer } from '../../helpers/geo';

// Directives
import bindData from '../../directives/bind-data';

// Stores
import { globalStore } from '../../store/GlobalStore';
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';

// Types / Interfaces / Enums
import {
  LayerDescription,
  ProportionalSymbolsParameters,
  ProportionalSymbolsSymbolType,
  RenderVisibility,
} from '../../global.d';

// For now we keep an array of directives
// because otherwise the import is not detected by the compiler...
const directives = [ // eslint-disable-line @typescript-eslint/no-unused-vars
  bindData,
];

export default function proportionalSymbolsRenderer(
  layerDescription: LayerDescription,
): JSX.Element {
  // This should never happen...
  // We are doing it to inform TypeScript that we are sure that the rendererParameters
  // property is not null (and so avoid the "Object is possibly 'null'" warning)
  if (layerDescription.rendererParameters == null) {
    throw Error('Unexpected Error: Renderer parameters not found');
  }

  // The parameters for this renderer
  const rendererParameters = layerDescription.rendererParameters as ProportionalSymbolsParameters;

  // Will scale the symbols according to the value of the variable
  const propSize = new (PropSizer as any)(
    rendererParameters.referenceValue,
    rendererParameters.referenceRadius,
    rendererParameters.symbolType,
  );

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
            if (rendererParameters.symbolType === ProportionalSymbolsSymbolType.circle) {
              const symbolSize = propSize.scale(
                feature.properties[rendererParameters.variable],
              );
              return <circle
                r={symbolSize}
                cx={projectedCoords[0]}
                cy={projectedCoords[1]}
                fill={rendererParameters.color as string}
                use:bindData={unproxify(feature)}
              ></circle>;
            }
            if (rendererParameters.symbolType === ProportionalSymbolsSymbolType.square) {
              const symbolSize = propSize.scale(
                feature.properties[rendererParameters.variable],
              );
              return <rect
                width={symbolSize}
                height={symbolSize}
                x={projectedCoords[0] - symbolSize / 2}
                y={projectedCoords[1] - symbolSize / 2}
                fill={rendererParameters.color}
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
