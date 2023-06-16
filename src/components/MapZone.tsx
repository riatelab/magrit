import {
  createEffect, For, JSX, onMount,
} from 'solid-js';
import d3 from '../helpers/d3-custom';
// import { v4 as uuidv4 } from 'uuid';
import { globalStore } from '../store/GlobalStore';
import { layersDescriptionStore } from '../store/LayersDescriptionStore';
import '../styles/MapZone.css';
import { unproxify } from '../helpers/common';

export default function MapZone(): JSX.Element {
  let svgElem;
  const sphere = { type: 'Sphere' };
  const projection = d3.geoNaturalEarth1();
  const initialTranslate = projection.translate();
  const initialScale = projection.scale();
  const pathGenerator = d3.geoPath(projection);
  const redraw = (e, redrawWhenZooming: boolean) => {
    if (!redrawWhenZooming) {
      d3.selectAll('g').attr('transform', e.transform);
    } else {
      projection.scale(e.transform.k * initialScale);
      projection.translate([
        e.transform.x - initialTranslate[0],
        e.transform.y - initialTranslate[1],
      ]);
      d3.selectAll('g').attr('transform', null);
      d3.selectAll('path').attr('d', pathGenerator);
    }
  };
  const zoom = d3.zoom()
    .on('zoom', (e) => {
      redraw(e, false);
    })
    .on('zoom.end', (e) => {
      redraw(e, false);
    });

  const getSphere = () => {
    const el = <path
        d={pathGenerator(sphere)}
        fill="#f2f2f7"
      />;
    // eslint-disable-next-line no-underscore-dangle
    el.__data__ = sphere;
    return <g>{ el }</g>;
  };

  const getClipSphere = () => {
    const el = <path d={pathGenerator(sphere)} />;
    // eslint-disable-next-line no-underscore-dangle
    el.__data__ = sphere;
    return <defs>{ el }</defs>;
  };

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
        class="map-zone__map"
      >
        { getSphere() }
        { getClipSphere() }

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
                        stroke-width="1px"
                        vector-effect="non-scaling-stroke"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        clip-path="url(#clip-sphere)"
                      />;
                      // Todo: we probably dont need to do what follows
                      // eslint-disable-next-line no-underscore-dangle
                      el.__data__ = unproxify(feature);
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
