// Import from solid-js
import { For, JSX, Show } from 'solid-js';

// Helpers
import { unproxify } from '../../helpers/common';

// Directives
import bindData from '../../directives/bind-data';

// Stores
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';

// Types / Interfaces / Enums
import {
  type LayerDescription,
  RenderVisibility,
} from '../../global';

// For now we keep an array of directives
// because otherwise the import is not detected by the compiler...
const directives = [ // eslint-disable-line @typescript-eslint/no-unused-vars
  bindData,
];

export function defaultLabelRenderer(
  layerDescription: LayerDescription,
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

export function graticuleLabelRenderer(
  layerDescription: LayerDescription,
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
