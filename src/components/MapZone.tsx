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
  sphereRenderer,
} from './MapRenderer/DefaultMapRenderer.tsx';
import { mapStore, setMapStore } from '../store/MapStore';
// import { unproxify } from '../helpers/common';

export default function MapZone(): JSX.Element {
  let svgElem;
  const projection = d3[mapStore.projection.value]();
  projection
    .translate([mapStore.mapDimensions.width / 2, mapStore.mapDimensions.height / 2]);
  const initialTranslate = projection.translate();
  const initialScale = projection.scale();
  const initialCenter = projection.center();
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
      const scaleValue = e.transform.k * initialScale;
      const translateValue = [
        e.transform.x,
        e.transform.y,
      ];
      globalStore.projection.scale(scaleValue);
      globalStore.projection.translate(translateValue);
      const centerValue = globalStore.projection.invert([
        mapStore.mapDimensions.width / 2,
        mapStore.mapDimensions.height / 2,
      ]);
      const rotateValue = globalStore.projection.rotate();
      // svg.selectAll('g').attr('transform', null);
      // svg.selectAll('path').attr('d', pathGenerator);
      svgElem?.querySelectorAll('g').forEach((g) => {
        g.removeAttribute('transform');
      });
      svgElem?.querySelectorAll('path').forEach((p) => {
        p.setAttribute('d', globalStore.pathGenerator(p.__data__)); // eslint-disable-line no-underscore-dangle
      });
      setMapStore({
        scale: scaleValue,
        translate: translateValue,
        center: centerValue,
        rotate: rotateValue,
      });
    }
  };

  const zoom = d3.zoom()
    .on('zoom', (e) => {
      redraw(e, false);
    })
    .on('zoom.end', (e) => {
      // redraw(e, true);
    });

  const getClipSphere = () => {
    const el = <path d={globalStore.pathGenerator({ type: 'Sphere' })} />;
    // eslint-disable-next-line no-underscore-dangle
    el.__data__ = { type: 'Sphere' };
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

        {/* Generate SVG path for each layer */}
        <For each={ layersDescriptionStore.layers.toReversed() }>
          {(layer) => {
            if (layer.renderer === 'sphere') {
              return sphereRenderer(layer);
            }
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
