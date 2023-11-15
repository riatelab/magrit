// Import from solid-js
import {
  createMemo, For, JSX, Show,
} from 'solid-js';

// Helpers
import { extractMeshAndMergedPolygonToGeojson } from '../../helpers/topojson';
import { unproxify } from '../../helpers/common';
import { mergeFilterIds } from './common.tsx';

// Stores
import { applicationSettingsStore, RenderVisibility } from '../../store/ApplicationSettingsStore';
import { globalStore } from '../../store/GlobalStore';

// Directives
import bindData from '../../directives/bind-data';

// Types / Interfaces / Enums
import { LayerDescription } from '../../global.d';

// For now we keep an array of directives
// because otherwise the import is not detected by the compiler...
const directives = [ // eslint-disable-line @typescript-eslint/no-unused-vars
  bindData,
];

export function defaultPolygonRendererOld(
  layerDescription: LayerDescription,
): JSX.Element {
  return <Show when={
    applicationSettingsStore.renderVisibility === RenderVisibility.RenderAsHidden
    || layerDescription.visible
  }>
    <g
      id={layerDescription.id}
      class="layer default"
      visibility={layerDescription.visible ? undefined : 'hidden'}
      fill={layerDescription.fillColor}
      fill-opacity={layerDescription.fillOpacity}
      stroke={layerDescription.strokeColor}
      stroke-width={layerDescription.strokeWidth}
      stroke-opacity={layerDescription.strokeOpacity}
      stroke-linecap="round"
      stroke-linejoin="round"
      clip-path="url(#clip-sphere)"
      filter={mergeFilterIds(layerDescription)}
      shape-rendering={layerDescription.shapeRendering}
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

export function defaultPolygonRenderer(
  layerDescription: LayerDescription,
): JSX.Element {
  // We should not need to use a memo here because the geometry
  // of the layer is not supposed to change (for now at least).
  const meshAndPolygons = createMemo(
    () => extractMeshAndMergedPolygonToGeojson(layerDescription.data),
  );
  return <Show when={
    applicationSettingsStore.renderVisibility === RenderVisibility.RenderAsHidden
    || layerDescription.visible
  }>
    <g
      id={layerDescription.id}
      class="layer default"
      visibility={layerDescription.visible ? undefined : 'hidden'}
      fill={layerDescription.fillColor}
      fill-opacity={layerDescription.fillOpacity}
      stroke={layerDescription.strokeColor}
      stroke-width={layerDescription.strokeWidth}
      stroke-opacity={layerDescription.strokeOpacity}
      stroke-linecap="round"
      stroke-linejoin="round"
      clip-path="url(#clip-sphere)"
      filter={mergeFilterIds(layerDescription)}
      shape-rendering={layerDescription.shapeRendering}
    >
      <path
        use:bindData={meshAndPolygons().polygons}
        d={globalStore.pathGenerator(meshAndPolygons().polygons)}
        vector-effect="non-scaling-stroke"
      />
      <path
        use:bindData={meshAndPolygons().mesh}
        d={globalStore.pathGenerator(meshAndPolygons().mesh)}
        vector-effect="non-scaling-stroke"
        fill="none"
      />;
    </g>
  </Show>;
}

export function defaultPointRenderer(
  layerDescription: LayerDescription,
): JSX.Element {
  return <Show when={
    applicationSettingsStore.renderVisibility === RenderVisibility.RenderAsHidden
    || layerDescription.visible
  }>
    <g
      id={layerDescription.id}
      class="layer default"
      visibility={layerDescription.visible ? undefined : 'hidden'}
      fill={layerDescription.fillColor}
      fill-opacity={layerDescription.fillOpacity}
      stroke={layerDescription.strokeColor}
      stroke-width={layerDescription.strokeWidth}
      stroke-opacity={layerDescription.strokeOpacity}
      stroke-linecap="round"
      stroke-linejoin="round"
      // clip-path="url(#clip-sphere)"
      filter={mergeFilterIds(layerDescription)}
    >
      <For each={layerDescription.data.features}>
        {
          (feature) => <path
            d={globalStore.pathGenerator.pointRadius(layerDescription.pointRadius)(feature)}
            vector-effect="non-scaling-stroke"
            use:bindData={unproxify(feature)}
          />
        }
      </For>
    </g>
  </Show>;
}

export function defaultLineRenderer(
  layerDescription: LayerDescription,
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
      stroke-width={layerDescription.strokeWidth}
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
            use:bindData={unproxify(feature)}
          />
        }
      </For>
    </g>
  </Show>;
}

export function sphereRenderer(layerDescription: LayerDescription): JSX.Element {
  return <Show when={
    applicationSettingsStore.renderVisibility === RenderVisibility.RenderAsHidden
    || layerDescription.visible
  }>
    <g
      class="layer sphere"
      id={layerDescription.id}
      visibility={layerDescription.visible ? undefined : 'hidden'}
      fill={layerDescription.fillColor}
      fill-opacity={layerDescription.fillOpacity}
      stroke={layerDescription.strokeColor}
      stroke-width={layerDescription.strokeWidth}
      stroke-opacity={layerDescription.strokeOpacity}
      stroke-linecap="round"
      stroke-linejoin="round"
      filter={mergeFilterIds(layerDescription)}
    >
      <path
        vector-effect="non-scaling-stroke"
        d={globalStore.pathGenerator(layerDescription.data)}
        use:bindData={unproxify(layerDescription.data)}
      />
    </g>
  </Show>;
}
