// Imports from solid-js
import {
  createMemo,
  For,
  JSX,
} from 'solid-js';

// GeoJSON Types
import type { Point } from 'geojson';

// Helpers
import { isNonNull } from '../../helpers/common';
import { getSymbolPath } from '../../helpers/svg';
import { mergeFilterIds } from './common.tsx';
import d3 from '../../helpers/d3-custom';

// Stores
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';
import { globalStore } from '../../store/GlobalStore';
import { mapStore } from '../../store/MapStore';

// Directives
import bindData from '../../directives/bind-data';

// Types / Interfaces / Enums
import {
  type TrivariateChoroplethParameters,
  type LayerDescriptionTrivariateChoropleth,
} from '../../global.d';

// For now we keep an array of directives
// because otherwise the import is not detected by the compiler...
const directives = [ // eslint-disable-line @typescript-eslint/no-unused-vars
  bindData,
];

export function trivariateChoroplethPolygonRenderer(
  layerDescription: LayerDescriptionTrivariateChoropleth,
): JSX.Element {
  const rendererParameters = createMemo(
    () => layerDescription.rendererParameters as TrivariateChoroplethParameters,
  );

  return <g
    id={layerDescription.id}
    class="layer trivariate-choropleth"
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
    <For each={d3.geoStitch(layerDescription.data).features}>
      {
        (feature) => <path
          fill={'grey'}
          d={globalStore.pathGenerator(feature)}
          vector-effect="non-scaling-stroke"
          // @ts-expect-error because use:bind-data isn't a property of this element
          use:bindData={feature}
        />
      }
    </For>
  </g>;
}

export function trivariateChoroplethLegendRenderer(
  layerDescription: LayerDescriptionTrivariateChoropleth,
): JSX.Element {
  const rendererParameters = createMemo(
    () => layerDescription.rendererParameters as TrivariateChoroplethParameters,
  );

  return <g
    id={layerDescription.id}
    class="layer trivariate-choropleth"
    visibility={layerDescription.visible ? undefined : 'hidden'}
    fill="none"
    stroke-width={layerDescription.strokeWidth}
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
          stroke={'grey'}
          d={globalStore.pathGenerator(feature)}
          vector-effect="non-scaling-stroke"
          // @ts-expect-error because use:bind-data isn't a property of this element
          use:bindData={feature}
        />
      }
    </For>
  </g>;
}

export function trivariateChoroplethPointRenderer(
  layerDescription: LayerDescriptionTrivariateChoropleth,
): JSX.Element {
  const rendererParameters = createMemo(
    () => layerDescription.rendererParameters as TrivariateChoroplethParameters,
  );

  return <g
    id={layerDescription.id}
    class="layer trivariate-choropleth"
    visibility={layerDescription.visible ? undefined : 'hidden'}
    fill-opacity={layerDescription.fillOpacity}
    stroke={layerDescription.strokeColor}
    stroke-width={layerDescription.strokeWidth}
    stroke-opacity={layerDescription.strokeOpacity}
    stroke-linecap="round"
    stroke-linejoin="round"
    // clip-path={mapStore.projection.type === 'd3' ? 'url(#clip-sphere)' : undefined}
    filter={mergeFilterIds(layerDescription)}
    mgt:geometry-type={layerDescription.type}
    mgt:portrayal-type={layerDescription.representationType}
    mgt:symbol-size={layerDescription.symbolSize}
    mgt:symbol-type={layerDescription.symbolType}
  >
    <For each={layerDescription.data.features}>
      {
        (feature) => <path
          fill={'grey'}
          d={
            getSymbolPath(
              layerDescription.symbolType!,
              globalStore.projection((feature.geometry as Point).coordinates),
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
