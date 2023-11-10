// Import from solid-js
import { For, JSX, Show } from 'solid-js';

// Helpers
import { unproxify } from '../../helpers/common';

// Directives
import bindData from '../../directives/bind-data';

// Stores
import { applicationSettingsStore, RenderVisibility } from '../../store/ApplicationSettingsStore';
import { globalStore } from '../../store/GlobalStore';

// Types / Interfaces / Enums
import {
  LabelsParameters,
  type LayerDescriptionLabels,
} from '../../global.d';

// For now we keep an array of directives
// because otherwise the import is not detected by the compiler...
const directives = [ // eslint-disable-line @typescript-eslint/no-unused-vars
  bindData,
];

export function defaultLabelsRenderer(
  layerDescription: LayerDescriptionLabels,
): JSX.Element {
  const rendererParameters = layerDescription.rendererParameters as LabelsParameters;

  return <Show when={
    applicationSettingsStore.renderVisibility === RenderVisibility.RenderAsHidden
    || layerDescription.visible
  }>
    <g
      id={layerDescription.id}
      class={'layer labels'}
      visibility={layerDescription.visible ? undefined : 'hidden'}
      filter={layerDescription.dropShadow ? `url(#filter-drop-shadow-${layerDescription.id})` : undefined}
    >
      <For each={layerDescription.data.features}>
        {
          (feature) => {
            const projectedCoords = globalStore.projection(feature.geometry.coordinates);
            return <text
              use:bindData={unproxify(feature)}
              x={projectedCoords[0] + rendererParameters.textOffset[0]}
              y={projectedCoords[1] + rendererParameters.textOffset[1]}
              alignment-baseline={rendererParameters.textAlignment}
              text-anchor={rendererParameters.textAnchor}
              font-family={rendererParameters.fontFamily}
              font-size={rendererParameters.fontSize}
              font-weight={rendererParameters.fontWeight}
              fill={rendererParameters.fontColor}
            >{ feature.properties[rendererParameters.variable] }</text>;
          }
        }
      </For>
    </g>
  </Show>;
}

export function graticuleLabelsRenderer(
  layerDescription: LayerDescriptionLabels,
): JSX.Element {
  return <Show when={
    applicationSettingsStore.renderVisibility === RenderVisibility.RenderAsHidden
    || layerDescription.visible
  }>
    <g>
      <For each={layerDescription.data.features}>
        {
          (feature) => <text
            use:bindData={unproxify(feature)}
          ></text>
        }
      </For>
    </g>
  </Show>;
}
