import { createEffect, For, JSX } from 'solid-js';
import d3 from '../helpers/d3-custom';
// import { v4 as uuidv4 } from 'uuid';
import { globalStore } from '../store/GlobalStore';
import { layersDescriptionStore } from '../store/LayersDescriptionStore';
import '../styles/MapZone.css';
import { unproxify } from '../helpers/common';

console.log(d3);

export default function MapZone(): JSX.Element {
  const sphere = { type: 'Sphere' };
  const projection = d3.geoNaturalEarth1();
  const pathGenerator = d3.geoPath(projection);

  createEffect(() => {
    console.log('layersDescriptionStore.layers', layersDescriptionStore.layers);
  });

  return <div class="map-zone">
    <div class="map-zone__inner">
      <svg
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
            (layerDescription: LayerDescription) => <g id={layerDescription.name}>
                <For each={ layerDescription.data.features }>
                  {
                    (feature) => {
                      const el = <path
                        d={pathGenerator(feature)}
                        fill="black"
                        stroke="white"
                        clip-path="url(#clip-sphere)"
                      />;
                      // Todo: we probably dont need to do what follows
                      el.__data__ = unproxify(feature); // eslint-disable-line no-underscore-dangle
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
