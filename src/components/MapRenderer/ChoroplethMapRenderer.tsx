import { For, JSX } from 'solid-js';
import { globalStore } from '../../store/GlobalStore.ts';
import { LayerDescription } from '../../global';

export function choroplethPolygonRenderer(
  layerDescription: LayerDescription,
): JSX.Element {
  return <g
    id={layerDescription.name}
    class="layer choropleth"
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
  </g>;
}
