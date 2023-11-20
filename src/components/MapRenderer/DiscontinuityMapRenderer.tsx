// Imports from solid-js
import { For, JSX, Show } from 'solid-js';

// Helpers
import { mergeFilterIds } from './common.tsx';
import { unproxify } from '../../helpers/common';

// Stores
import { applicationSettingsStore, RenderVisibility } from '../../store/ApplicationSettingsStore';
import { globalStore } from '../../store/GlobalStore';

// Directives
import bindData from '../../directives/bind-data';

// Types / Interfaces / Enums
import type { LayerDescriptionDiscontinuity } from '../../global';

// For now we keep an array of directives
// because otherwise the import is not detected by the compiler...
const directives = [ // eslint-disable-line @typescript-eslint/no-unused-vars
  bindData,
];

export default function discontinuityRenderer(
  layerDescription: LayerDescriptionDiscontinuity,
): JSX.Element {
  return <Show when={
    applicationSettingsStore.renderVisibility === RenderVisibility.RenderAsHidden
    || layerDescription.visible
  }>
    <g
      id={layerDescription.id}
      class="layer default"
      visibility={layerDescription.visible ? undefined : 'hidden'}
      fill="none"
      stroke={layerDescription.strokeColor}
      stroke-opacity={layerDescription.strokeOpacity}
      stroke-linecap="round"
      stroke-linejoin="round"
      clip-path="url(#clip-sphere)"
      filter={mergeFilterIds(layerDescription)}
    >
      <For each={layerDescription.data.features}>
        {
          (feature) => <path
            d={globalStore.pathGenerator(feature)}
            vector-effect="non-scaling-stroke"
            stroke-width={feature.properties.value}
            use:bindData={unproxify(feature as never)}
          />
        }
      </For>
    </g>
  </Show>;
}
