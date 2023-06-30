import { For, JSX, JSXElement } from 'solid-js';
import { globalStore } from '../../store/GlobalStore';
import { LayerDescription } from '../../global';

export function defaultPolygonRenderer(
  layerDescription: LayerDescription,
): JSX.Element {
  return <g
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
  >
    <For each={layerDescription.data.features}>
      {
        (feature) => {
          const el: JSXElement = <path
            d={globalStore.pathGenerator(feature)}
            vector-effect="non-scaling-stroke"
          />;
          // el.__data__ = unproxify(feature); // eslint-disable-line no-underscore-dangle
          el.__data__ = feature; // eslint-disable-line no-underscore-dangle
          return el;
        }
      }
    </For>
  </g>;
}

export function defaultPointRenderer(
  layerDescription: LayerDescription,
): JSX.Element {
  return <g
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
  >
    <For each={layerDescription.data.features}>
      {
        (feature) => {
          const el: JSXElement = <path
            d={globalStore.pathGenerator.pointRadius(layerDescription.pointRadius)(feature)}
            vector-effect="non-scaling-stroke"
          />;
          // el.__data__ = unproxify(feature); // eslint-disable-line no-underscore-dangle
          el.__data__ = feature; // eslint-disable-line no-underscore-dangle
          return el;
        }
      }
    </For>
  </g>;
}

export function defaultLineRenderer(
  layerDescription: LayerDescription,
): JSX.Element {
  return <g
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
  >
    <For each={layerDescription.data.features}>
      {
        (feature) => {
          const el: JSXElement = <path
            d={globalStore.pathGenerator(feature)}
            vector-effect="non-scaling-stroke"
          />;
          // el.__data__ = unproxify(feature); // eslint-disable-line no-underscore-dangle
          el.__data__ = feature; // eslint-disable-line no-underscore-dangle
          return el;
        }
      }
    </For>
  </g>;
}
