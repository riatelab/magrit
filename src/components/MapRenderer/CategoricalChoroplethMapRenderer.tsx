// Imports from solid-js
import {
  createMemo,
  For,
  JSX,
} from 'solid-js';

// Helpers
import { mergeFilterIds } from './common.tsx';
import { getSymbolPath } from '../../helpers/svg';

// Stores
import { globalStore } from '../../store/GlobalStore';

// Directives
import bindData from '../../directives/bind-data';

// Types / Interfaces / Enums
import {
  type CategoricalChoroplethParameters,
  type LayerDescriptionCategoricalChoropleth,
} from '../../global.d';

// For now we keep an array of directives
// because otherwise the import is not detected by the compiler...
const directives = [ // eslint-disable-line @typescript-eslint/no-unused-vars
  bindData,
];

export function categoricalChoroplethPolygonRenderer(
  layerDescription: LayerDescriptionCategoricalChoropleth,
): JSX.Element {
  const rendererParameters = createMemo(
    () => layerDescription.rendererParameters as CategoricalChoroplethParameters,
  );

  const colorsMap = createMemo(
    () => {
      const map = new Map<string | number | null | undefined, string>(
        rendererParameters().mapping.map(({ value, color }) => [value, color]),
      );
      map.set('', rendererParameters().noDataColor);
      map.set(null, rendererParameters().noDataColor);
      map.set(undefined, rendererParameters().noDataColor);
      return map;
    },
  );

  return <g
    id={layerDescription.id}
    class="layer categoricalChoropleth"
    visibility={layerDescription.visible ? undefined : 'hidden'}
    // fill={layerDescription.fillColor}
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
          fill={colorsMap().get(feature.properties[layerDescription.rendererParameters.variable])}
          d={globalStore.pathGenerator(feature)}
          vector-effect="non-scaling-stroke"
          // @ts-expect-error because use:bind-data isn't a property of this element
          use:bindData={feature}
        />
      }
    </For>
  </g>;
}

export function categoricalChoroplethPointRenderer(
  layerDescription: LayerDescriptionCategoricalChoropleth,
): JSX.Element {
  const rendererParameters = createMemo(
    () => layerDescription.rendererParameters as CategoricalChoroplethParameters,
  );

  const colorsMap = createMemo(
    () => {
      const map = new Map<string | number | null | undefined, string>(
        rendererParameters().mapping.map(({ value, color }) => [value, color]),
      );
      map.set('', rendererParameters().noDataColor);
      map.set(null, rendererParameters().noDataColor);
      map.set(undefined, rendererParameters().noDataColor);
      return map;
    },
  );

  return <g
    id={layerDescription.id}
    class="layer categoricalChoropleth"
    visibility={layerDescription.visible ? undefined : 'hidden'}
    // fill={layerDescription.fillColor}
    fill-opacity={layerDescription.fillOpacity}
    stroke={layerDescription.strokeColor}
    stroke-width={layerDescription.strokeWidth}
    stroke-opacity={layerDescription.strokeOpacity}
    stroke-linecap="round"
    stroke-linejoin="round"
    // clip-path="url(#clip-sphere)"
    filter={mergeFilterIds(layerDescription)}
    mgt:geometry-type={layerDescription.type}
    mgt:portrayal-type={layerDescription.renderer}
    mgt:symbol-size={layerDescription.symbolSize}
    mgt:symbol-type={layerDescription.symbolType}
  >
    <For each={layerDescription.data.features}>
      {
        (feature) => <path
          fill={colorsMap().get(feature.properties[layerDescription.rendererParameters.variable])}
          d={
            getSymbolPath(
              layerDescription.symbolType!,
              globalStore.projection(feature.geometry.coordinates),
              layerDescription.symbolSize!,
            )
          }
          vector-effect="non-scaling-stroke"
          // @ts-expect-error because use:bind-data isn't a property of this element
          use:bindData={feature}
        />
      }
    </For>
  </g>;
}

export function categoricalChoroplethLineRenderer(
  layerDescription: LayerDescriptionCategoricalChoropleth,
): JSX.Element {
  const rendererParameters = createMemo(
    () => layerDescription.rendererParameters as CategoricalChoroplethParameters,
  );

  const colorsMap = createMemo(
    () => {
      const map = new Map<string | number | null | undefined, string>(
        rendererParameters().mapping.map(({ value, color }) => [value, color]),
      );
      map.set('', rendererParameters().noDataColor);
      map.set(null, rendererParameters().noDataColor);
      map.set(undefined, rendererParameters().noDataColor);
      return map;
    },
  );

  return <g
    id={layerDescription.id}
    class="layer categoricalChoropleth"
    visibility={layerDescription.visible ? undefined : 'hidden'}
    fill="none"
    // stroke={layerDescription.strokeColor}
    stroke-width={layerDescription.strokeWidth}
    stroke-opacity={layerDescription.strokeOpacity}
    stroke-linecap="round"
    stroke-linejoin="round"
    clip-path="url(#clip-sphere)"
    filter={mergeFilterIds(layerDescription)}
    mgt:geometry-type={layerDescription.type}
    mgt:portrayal-type={layerDescription.renderer}
  >
    <For each={layerDescription.data.features}>
      {
        (feature) => <path
          stroke={
            colorsMap().get(feature.properties[layerDescription.rendererParameters.variable])
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
