// Imports from solid-js
import {
  createMemo,
  For,
  JSX,
} from 'solid-js';

// Helpers
import { mergeFilterIds } from './common.tsx';
import { getClassifier } from '../../helpers/classification';

// Stores
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';
import { globalStore } from '../../store/GlobalStore';
import { mapStore } from '../../store/MapStore';

// Directives
import bindData from '../../directives/bind-data';

// Types / Interfaces / Enums
import type { DiscontinuityParameters, LayerDescriptionDiscontinuity } from '../../global';
import { ClassificationMethod } from '../../global.d';

// For now we keep an array of directives
// because otherwise the import is not detected by the compiler...
const directives = [ // eslint-disable-line @typescript-eslint/no-unused-vars
  bindData,
];

export default function discontinuityRenderer(
  layerDescription: LayerDescriptionDiscontinuity,
): JSX.Element {
  const rendererParameters = createMemo(
    () => layerDescription.rendererParameters as DiscontinuityParameters,
  );

  const classifier = createMemo(() => {
    const Cls = getClassifier(ClassificationMethod.manual);
    return new Cls(
      null,
      null,
      applicationSettingsStore.intervalClosure,
      rendererParameters().breaks,
    );
  });

  const sizes = createMemo(() => rendererParameters().sizes);

  return <g
    id={layerDescription.id}
    class="layer discontinuity"
    visibility={layerDescription.visible ? undefined : 'hidden'}
    fill="none"
    stroke={layerDescription.strokeColor}
    stroke-opacity={layerDescription.strokeOpacity}
    stroke-linecap="round"
    stroke-linejoin="round"
    clip-path={mapStore.projection.type === 'd3' ? 'url(#clip-sphere)' : undefined}
    filter={mergeFilterIds(layerDescription)}
    mgt:geometry-type={layerDescription.type}
    mgt:portrayal-type={layerDescription.representationType}
  >
    <For each={layerDescription.data.features}>
      {
        (feature) => <path
          d={globalStore.pathGenerator(feature)}
          vector-effect="non-scaling-stroke"
          stroke-width={sizes()[classifier().getClass(feature.properties!.value)]}
          // @ts-expect-error because use:bind-data isn't a property of this element
          use:bindData={feature}
        />
      }
    </For>
  </g>;
}
