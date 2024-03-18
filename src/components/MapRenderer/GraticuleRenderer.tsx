import { For, JSX } from 'solid-js';

// Stores
import { globalStore } from '../../store/GlobalStore';

// Helpers
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
  return <g
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
    mgt:geometry-type={layerDescription.type}
    mgt:portrayal-type={layerDescription.renderer}
  >
    <For each={layerDescription.data.features}>
      {
        (feature) => <path
          d={globalStore.pathGenerator(feature)}
          vector-effect="non-scaling-stroke"
          use:bindData={feature}
        />
      }
    </For>
  </g>;
}
