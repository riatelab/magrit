import {
  createEffect, For, JSX, onMount,
} from 'solid-js';
import d3 from '../helpers/d3-custom';
// import { v4 as uuidv4 } from 'uuid';
import { globalStore } from '../store/GlobalStore';
import { layersDescriptionStore } from '../store/LayersDescriptionStore';
import '../styles/MapZone.css';
// import { unproxify } from '../helpers/common';

console.log(d3);

export default function MapZone(): JSX.Element {
  let svgElem;
  const sphere = { type: 'Sphere' };
  const projection = d3.geoNaturalEarth1();
  const pathGenerator = d3.geoPath(projection);
  const zoom = d3.zoom().on('zoom', (e) => {
    d3.selectAll('g').attr('transform', e.transform);
  });

  createEffect(() => {
    console.log('layersDescriptionStore.layers', layersDescriptionStore.layers);
  });

  onMount(() => {
    const svg = d3.select(svgElem);
    svg.call(zoom);
  });

  return <div class="map-zone">
    <div class="map-zone__inner">
      <svg
        ref={svgElem}
        width={globalStore.mapDimensions.width}
        height={globalStore.mapDimensions.height}
        class="map-zone__map">
        <defs>
          <clipPath id="clip-sphere">
            <path d={pathGenerator(sphere)} />
          </clipPath>
        </defs>

        <g>
          <path
            d={pathGenerator(sphere)}
            fill="#f2f2f7"
          />
        </g>
      {/* Generate SVG path for each layer */}
        <For each={ layersDescriptionStore.layers }>
          {
            (layerDescription: LayerDescription) => <g id={layerDescription.name} visibility={ layerDescription.visible ? 'undefined' : 'hidden' }>
                <For each={ layerDescription.data.features }>
                  {
                    (feature) => {
                      const el = <path
                        d={pathGenerator(feature)}
                        fill="black"
                        stroke="white"
                        stroke-width="0.1"
                        clip-path="url(#clip-sphere)"
                      />;
                      // Todo: we probably dont need to do what follows
                      // eslint-disable-next-line no-underscore-dangle
                      // el.__data__ = unproxify(feature);
                      return el;
                    }
                  }
                </For>
              </g>
          }
        </For>
      </svg>
    </div>
  </div>;
}
