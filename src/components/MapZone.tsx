import {
  createEffect, For, JSX, JSXElement, onMount,
} from 'solid-js';
import d3 from '../helpers/d3-custom';
import { globalStore } from '../store/GlobalStore';
import { layersDescriptionStore } from '../store/LayersDescriptionStore';
import '../styles/MapZone.css';
import { unproxify } from '../helpers/common';

export default function MapZone(): JSX.Element {
  let svgElem;
  let svg;
  const sphere = { type: 'Sphere' };
  const projection = d3.geoNaturalEarth1();
  const initialTranslate = projection.translate();
  const initialScale = projection.scale();
  const pathGenerator = d3.geoPath(projection);
  const redraw = (e, redrawWhenZooming: boolean) => {
    if (!redrawWhenZooming) {
      svg.selectAll('g').attr('transform', e.transform);
    } else {
      projection.scale(e.transform.k * initialScale);
      projection.translate([
        e.transform.x - initialTranslate[0],
        e.transform.y - initialTranslate[1],
      ]);
      svg.selectAll('g').attr('transform', null);
      svg.selectAll('path').attr('d', pathGenerator); // eslint-disable-line no-underscore-dangle
    }
  };
  const zoom = d3.zoom()
    .on('zoom', (e) => {
      redraw(e, false);
    })
    .on('zoom.end', (e) => {
      redraw(e, true);
    });

  const getSphere = () => {
    const el = <path
        d={pathGenerator(sphere)}
        fill="#f2f2f7"
      />;
    // eslint-disable-next-line no-underscore-dangle
    el.__data__ = sphere;
    return <g class="layer sphere">{ el }</g>;
  };

  const getClipSphere = () => {
    const el = <path d={pathGenerator(sphere)} />;
    // eslint-disable-next-line no-underscore-dangle
    el.__data__ = sphere;
    return <defs><clipPath id="clip-sphere">{ el }</clipPath></defs>;
  };

  createEffect(() => {
    console.log('layersDescriptionStore.layers', layersDescriptionStore.layers);
  });

  onMount(() => {
    svg = d3.select(svgElem);
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
        <defs>
          { getClipSphere() }
        </defs>

        { getSphere() }

        {/* Generate SVG path for each layer */}
        <For each={ layersDescriptionStore.layers.toReversed() }>
          {
            (layerDescription: LayerDescription) => <g
              id={layerDescription.name}
              class="layer default"
              visibility={ layerDescription.visible ? undefined : 'hidden' }
              fill={ layerDescription.fillColor }
              fill-opacity={ layerDescription.fillOpacity }
              stroke={ layerDescription.strokeColor }
              stroke-width={ layerDescription.strokeWidth }
              stroke-opacity={ layerDescription.strokeOpacity }
              stroke-linecap="round"
              stroke-linejoin="round"
              clip-path="url(#clip-sphere)"
            >
              <For each={ layerDescription.data.features }>
                {
                  (feature) => {
                    const el: JSXElement = <path
                      d={pathGenerator(feature)}
                      vector-effect="non-scaling-stroke"
                    />;
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
