// Imports from solid-js
import {
  createMemo,
  For,
  JSX,
} from 'solid-js';

// Helpers
import { getClassifier } from '../../helpers/classification';
import { mergeFilterIds } from './common.tsx';

// Stores
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';
import { globalStore } from '../../store/GlobalStore';
import { mapStore } from '../../store/MapStore';

// Directives
import bindData from '../../directives/bind-data';

// Types / Interfaces / Enums
import {
  ClassificationMethod,
  type ClassificationParameters,
  type LayerDescriptionGriddedLayer,
} from '../../global.d';

// For now we keep an array of directives
// because otherwise the import is not detected by the compiler...
const directives = [ // eslint-disable-line @typescript-eslint/no-unused-vars
  bindData,
];

export default function gridRenderer(
  layerDescription: LayerDescriptionGriddedLayer,
): JSX.Element {
  const rendererParameters = createMemo(
    () => layerDescription.rendererParameters as ClassificationParameters,
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

  return <g
    id={layerDescription.id}
    class="layer choropleth"
    visibility={layerDescription.visible ? undefined : 'hidden'}
    fill-opacity={layerDescription.fillOpacity}
    stroke={layerDescription.strokeColor}
    stroke-width={layerDescription.strokeWidth}
    stroke-opacity={layerDescription.strokeOpacity}
    stroke-linecap="round"
    stroke-linejoin="round"
    clip-path={mapStore.projection.type === 'd3' ? 'url(#clip-sphere)' : undefined}
    filter={mergeFilterIds(layerDescription)}
    shape-rendering={
      (layerDescription.strokeWidth === 0 || layerDescription.strokeOpacity === 0)
        ? 'crispEdges'
        : layerDescription.shapeRendering
    }
    mgt:geometry-type={layerDescription.type}
    mgt:portrayal-type={layerDescription.representationType}
  >
    <For each={layerDescription.data.features}>
      {
        (feature) => <path
          fill={
            rendererParameters().palette.colors[
              classifier().getClass(feature.properties![rendererParameters().variable])
            ]
          }
          d={globalStore.pathGenerator(feature)}
          vector-effect="non-scaling-stroke"
          // @ts-expect-error because use:bind-data isn't a property of this element
          use:bindData={feature}
        />
      }
    </For>
  </g>;
}
