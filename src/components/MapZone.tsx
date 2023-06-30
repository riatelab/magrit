import {
  createEffect, For, JSX, onMount,
} from 'solid-js';
import d3 from '../helpers/d3-custom';
import { globalStore, setGlobalStore } from '../store/GlobalStore';
import { layersDescriptionStore } from '../store/LayersDescriptionStore';
import '../styles/MapZone.css';
import {
  defaultLineRenderer,
  defaultPointRenderer,
  defaultPolygonRenderer,
} from './MapRenderer/DefaultMapRenderer.tsx';
import { mapStore } from '../store/MapStore';
// import { unproxify } from '../helpers/common';

export default function MapZone(): JSX.Element {
  let svgElem;
  let svg;
  const sphere = { type: 'Sphere' };
  const projection = d3.geoArmadillo()
    .translate([-mapStore.mapDimensions.width / 2, -mapStore.mapDimensions.height / 2]);
  const initialTranslate = projection.translate();
  const initialScale = projection.scale();
  const pathGenerator = d3.geoPath(projection);

  setGlobalStore(
    'projection',
    () => projection,
  );
  setGlobalStore(
    'pathGenerator',
    () => pathGenerator,
  );
  const redraw = (e, redrawWhenZooming: boolean) => {
    if (!redrawWhenZooming) {
      // svg.selectAll('g').attr('transform', e.transform);
      svgElem.querySelectorAll('g').forEach((g) => {
        g.setAttribute('transform', e.transform);
      });
    } else {
      globalStore.projection.scale(e.transform.k * initialScale);
      globalStore.projection.translate([
        e.transform.x - initialTranslate[0],
        e.transform.y - initialTranslate[1],
      ]);
      // svg.selectAll('g').attr('transform', null);
      // svg.selectAll('path').attr('d', pathGenerator);
      svgElem?.querySelectorAll('g').forEach((g) => {
        g.removeAttribute('transform');
      });
      svgElem?.querySelectorAll('path').forEach((p) => {
        p.setAttribute('d', globalStore.pathGenerator(p.__data__)); // eslint-disable-line no-underscore-dangle
      });
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
        d={globalStore.pathGenerator(sphere)}
        fill="#f2f2f7"
      />;
    // eslint-disable-next-line no-underscore-dangle
    el.__data__ = sphere;
    return <g class="layer sphere">{ el }</g>;
  };

  const getClipSphere = () => {
    const el = <path d={globalStore.pathGenerator(sphere)} />;
    // eslint-disable-next-line no-underscore-dangle
    el.__data__ = sphere;
    return <defs><clipPath id="clip-sphere">{ el }</clipPath></defs>;
  };

  createEffect(() => {
    console.log('layersDescriptionStore.layers', layersDescriptionStore.layers);
  });

  onMount(() => {
    // svg = d3.select(svgElem);
    // svg.call(zoom);
    zoom.apply(null, [d3.select(svgElem)]);
  });

  return <div class="map-zone">
    <div class="map-zone__inner">
      <svg
        ref={svgElem}
        width={mapStore.mapDimensions.width}
        height={mapStore.mapDimensions.height}
        class="map-zone__map"
      >
        <defs>
          { getClipSphere() }
        </defs>

        { getSphere() }

        {/* Generate SVG path for each layer */}
        <For each={ layersDescriptionStore.layers.toReversed() }>
          {(layer) => {
            if (layer.type === 'polygon') {
              return defaultPolygonRenderer(layer);
            }
            if (layer.type === 'point') {
              return defaultPointRenderer(layer);
            }
            if (layer.type === 'linestring') {
              return defaultLineRenderer(layer);
            }
            return null;
          }}
        </For>
      </svg>
    </div>
  </div>;
}
