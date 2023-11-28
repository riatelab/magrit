// Imports from solid-js
import {
  createMemo,
  For,
  JSX,
  Show,
} from 'solid-js';

// Helpers
import { unproxify } from '../../helpers/common';
import { mergeFilterIds } from './common.tsx';

// Stores
import { applicationSettingsStore, RenderVisibility } from '../../store/ApplicationSettingsStore';
import { globalStore } from '../../store/GlobalStore';

// Directives
import bindData from '../../directives/bind-data';

// Types / Interfaces / Enums
import {
  CategoricalChoroplethParameters,
  LayerDescriptionCategoricalChoropleth,
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
        rendererParameters().mapping.map(([value, _, color]) => [value, color]),
      );
      map.set('', rendererParameters().noDataColor);
      map.set(null, rendererParameters().noDataColor);
      map.set(undefined, rendererParameters().noDataColor);
      return map;
    },
  );

  return <Show when={
    applicationSettingsStore.renderVisibility === RenderVisibility.RenderAsHidden
    || layerDescription.visible
  }>
    <g
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
      shape-rendering={layerDescription.shapeRendering}
    >
      <For each={layerDescription.data.features}>
        {
          (feature) => <path
            fill={colorsMap().get(feature.properties[layerDescription.rendererParameters.variable])}
            d={globalStore.pathGenerator(feature)}
            vector-effect="non-scaling-stroke"
            use:bindData={unproxify(feature)}
          />
        }
      </For>
    </g>
  </Show>;
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
        rendererParameters().mapping.map(([value, _, color]) => [value, color]),
      );
      map.set('', rendererParameters().noDataColor);
      map.set(null, rendererParameters().noDataColor);
      map.set(undefined, rendererParameters().noDataColor);
      return map;
    },
  );

  return <Show when={
    applicationSettingsStore.renderVisibility === RenderVisibility.RenderAsHidden
    || layerDescription.visible
  }>
    <g
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
    >
      <For each={layerDescription.data.features}>
        {
          (feature) => <path
            fill={colorsMap().get(feature.properties[layerDescription.rendererParameters.variable])}
            d={globalStore.pathGenerator.pointRadius(layerDescription.pointRadius)(feature)}
            vector-effect="non-scaling-stroke"
            use:bindData={unproxify(feature)}
          />
        }
      </For>
    </g>
  </Show>;
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
        rendererParameters().mapping.map(([value, _, color]) => [value, color]),
      );
      map.set('', rendererParameters().noDataColor);
      map.set(null, rendererParameters().noDataColor);
      map.set(undefined, rendererParameters().noDataColor);
      return map;
    },
  );

  return <Show when={
    applicationSettingsStore.renderVisibility === RenderVisibility.RenderAsHidden
    || layerDescription.visible
  }>
    <g
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
    >
      <For each={layerDescription.data.features}>
        {
          (feature) => <path
            stroke={
              colorsMap().get(feature.properties[layerDescription.rendererParameters.variable])
            }
            d={globalStore.pathGenerator(feature)}
            vector-effect="non-scaling-stroke"
            use:bindData={unproxify(feature)}
          />
        }
      </For>
    </g>
  </Show>;
}
