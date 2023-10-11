// Import from solid-js
import { For, JSX, Show } from 'solid-js';

// Stores
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';

// Types / Interfaces / Enums
import {
  type LayerDescription,
  RenderVisibility,
} from '../../global';

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
          (feature) => <></>
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
          (feature) => <></>
        }
      </For>
    </g>
  </Show>;
}
