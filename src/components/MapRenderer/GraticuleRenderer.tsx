import { For, JSX, Show } from 'solid-js';

// Stores
import { applicationSettingsStore, RenderVisibility } from '../../store/ApplicationSettingsStore';
import { globalStore } from '../../store/GlobalStore';

// Helpers
import { unproxify } from '../../helpers/common';
import { mergeFilterIds } from './common.tsx';

// Directives
import bindData from '../../directives/bind-data';

// Types / Interfaces / Enums
import { type LayerDescription } from '../../global.d';

// For now we keep an array of directives
// because otherwise the import is not detected by the compiler...
const directives = [ // eslint-disable-line @typescript-eslint/no-unused-vars
  bindData,
];

export default function graticuleRenderer(layerDescription: LayerDescription): JSX.Element {
  return <Show when={
    applicationSettingsStore.renderVisibility === RenderVisibility.RenderAsHidden
    || layerDescription.visible
  }>
    <g
      id={layerDescription.id}
      class="layer graticule"
      visibility={layerDescription.visible ? undefined : 'hidden'}
      fill="none"
      stroke={layerDescription.strokeColor}
      stroke-width={layerDescription.strokeWidth}
      stroke-opacity={layerDescription.strokeOpacity}
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-dasharray={layerDescription.strokeDasharray}
      clip-path="url(#clip-sphere)"
      filter={mergeFilterIds(layerDescription)}
    >
      <For each={layerDescription.data.features}>
        {
          (feature) => <path
            d={globalStore.pathGenerator(feature)}
            vector-effect="non-scaling-stroke"
            use:bindData={unproxify(feature)}
          />
        }
      </For>
    </g>
  </Show>;
}
