// Import from solid-js
import { For, JSX, Show } from 'solid-js';

// Stores
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';
import { globalStore } from '../../store/GlobalStore';

// Types / Interfaces / Enums
import { LayerDescription, RenderVisibility } from '../../global.d';

export function defaultPolygonRenderer(
  layerDescription: LayerDescription,
): JSX.Element {
  return <Show when={
    applicationSettingsStore.renderVisibility === RenderVisibility.RenderAsHidden
    || layerDescription.visible
  }>
    <g
      id={layerDescription.name}
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
      filter={layerDescription.dropShadow ? `url(#filter-drop-shadow-${layerDescription.id})` : undefined}
    >
      <For each={layerDescription.data.features}>
        {
          (feature) => {
            const el: JSX.Element = <path
              d={globalStore.pathGenerator(feature)}
              vector-effect="non-scaling-stroke"
            />;
            // el.__data__ = unproxify(feature); // eslint-disable-line no-underscore-dangle
            el.__data__ = feature; // eslint-disable-line no-underscore-dangle
            return el;
          }
        }
      </For>
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
      id={layerDescription.name}
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
      filter={layerDescription.dropShadow ? `url(#filter-drop-shadow-${layerDescription.id})` : undefined}
    >
      <For each={layerDescription.data.features}>
        {
          (feature) => {
            const el: JSX.Element = <path
              d={globalStore.pathGenerator.pointRadius(layerDescription.pointRadius)(feature)}
              vector-effect="non-scaling-stroke"
            />;
            // el.__data__ = unproxify(feature); // eslint-disable-line no-underscore-dangle
            el.__data__ = feature; // eslint-disable-line no-underscore-dangle
            return el;
          }
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
      id={layerDescription.name}
      class="layer default"
      visibility={layerDescription.visible ? undefined : 'hidden'}
      fill="none"
      stroke={layerDescription.strokeColor}
      stroke-width={layerDescription.strokeWidth}
      stroke-opacity={layerDescription.strokeOpacity}
      stroke-linecap="round"
      stroke-linejoin="round"
      clip-path="url(#clip-sphere)"
      filter={layerDescription.dropShadow ? `url(#filter-drop-shadow-${layerDescription.id})` : undefined}
    >
      <For each={layerDescription.data.features}>
        {
          (feature) => {
            const el: JSX.Element = <path
              d={globalStore.pathGenerator(feature)}
              vector-effect="non-scaling-stroke"
            />;
            // el.__data__ = unproxify(feature); // eslint-disable-line no-underscore-dangle
            el.__data__ = feature; // eslint-disable-line no-underscore-dangle
            return el;
          }
        }
      </For>
    </g>
  </Show>;
}

export function sphereRenderer(layerDescription: LayerDescription): JSX.Element {
  const el = <path
    vector-effect="non-scaling-stroke"
    d={globalStore.pathGenerator(layerDescription.data)}
  />;
  // eslint-disable-next-line no-underscore-dangle
  el.__data__ = layerDescription.data;
  return <Show when={
    applicationSettingsStore.renderVisibility === RenderVisibility.RenderAsHidden
    || layerDescription.visible
  }>
    <g
      class="layer sphere"
      id={layerDescription.name}
      visibility={layerDescription.visible ? undefined : 'hidden'}
      fill={layerDescription.fillColor}
      fill-opacity={layerDescription.fillOpacity}
      stroke={layerDescription.strokeColor}
      stroke-width={layerDescription.strokeWidth}
      stroke-opacity={layerDescription.strokeOpacity}
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      { el }
    </g>
  </Show>;
}
