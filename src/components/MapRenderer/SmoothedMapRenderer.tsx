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
import { globalStore } from '../../store/GlobalStore';

// Directives
import bindData from '../../directives/bind-data';

// Types / Interfaces / Enums
import {
  ClassificationMethod,
  type LayerDescriptionSmoothedLayer,
  type SmoothedLayerParameters,
} from '../../global.d';

// For now we keep an array of directives
// because otherwise the import is not detected by the compiler...
const directives = [ // eslint-disable-line @typescript-eslint/no-unused-vars
  bindData,
];

export default function smoothedMapRenderer(
  layerDescription: LayerDescriptionSmoothedLayer,
): JSX.Element {
  const rendererParameters = createMemo(
    () => layerDescription.rendererParameters as SmoothedLayerParameters,
  );

  const classifier = createMemo(() => {
    const Cls = getClassifier(ClassificationMethod.manual);
    return new Cls(null, null, rendererParameters().breaks);
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
    clip-path="url(#clip-sphere)"
    filter={mergeFilterIds(layerDescription)}
    shape-rendering={
      (layerDescription.strokeWidth === 0 || layerDescription.strokeOpacity === 0)
        ? 'crispEdges'
        : layerDescription.shapeRendering
    }
    mgt:geometry-type={layerDescription.type}
    mgt:portrayal-type={layerDescription.renderer}
  >
    <For each={layerDescription.data.features}>
      {
        (feature) => <path
          fill={
            rendererParameters().palette.colors[classifier().getClass(feature.properties.center_v)]
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
