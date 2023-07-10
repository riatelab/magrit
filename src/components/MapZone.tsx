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
import {
  choroplethLineRenderer,
  choroplethPointRenderer,
  choroplethPolygonRenderer,
} from './MapRenderer/ChoroplethMapRenderer.tsx';
import legendChoropleth from './LegendRenderer/ChoroplethLegend.tsx';
import { debounce } from '../helpers/common';
// import { unproxify } from '../helpers/common';

export default function MapZone(): JSX.Element {
  let svgElem;
  const projection = d3[mapStore.projection.value]();
  projection
    .translate([mapStore.mapDimensions.width / 2, mapStore.mapDimensions.height / 2]);
  let initialTranslate = projection.translate();
  let initialScale = projection.scale();
  const initialCenter = projection.center();
  const pathGenerator = d3.geoPath(projection);
  let lastTransform;

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
      svgElem.querySelectorAll('g.layer').forEach((g) => {
        g.setAttribute('transform', e.transform);
      });
      lastTransform = e.transform;
    } else {
      // const scaleValue = e.transform.k * initialScale;
      // const translateValue = [
      //   e.transform.x + initialTranslate[0],
      //   e.transform.y + initialTranslate[1],
      // ];
      const t = d3.zoomTransform(svgElem);
      console.log(t, e.transform);
      const scaleValue = t.k * initialScale;
      const translateValue = [
        (t.x) / initialScale,
        (t.y) / initialScale,
      ];

      globalStore.projection.translate(translateValue);
      globalStore.projection.scale(scaleValue);
      const centerValue = globalStore.projection.invert([
        mapStore.mapDimensions.width / 2,
        mapStore.mapDimensions.height / 2,
      ]);
      const rotateValue = globalStore.projection.rotate();
      // svg.selectAll('g').attr('transform', null);
      // svg.selectAll('path').attr('d', pathGenerator);
      svgElem.__zoom = d3.zoomIdentity; // eslint-disable-line no-underscore-dangle
      svgElem?.querySelectorAll('g.layer').forEach((g) => {
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
      initialScale = scaleValue;
      initialTranslate = translateValue;
    }
  };

  const redrawDebounced = debounce((e) => {
    redraw(e, true);
  }, 1000);

  const zoom = d3.zoom()
    .on('zoom', (e) => {
      redraw(e, false);
    })
    .on('zoom.end', (e) => {
      redrawDebounced(e);
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

        {/* Generate SVG group for each layer */}
        <For each={ layersDescriptionStore.layers.toReversed() }>
          {(layer) => {
            if (layer.renderer === 'sphere') {
              return sphereRenderer(layer);
            }
            if (layer.renderer === 'default') {
              if (layer.type === 'polygon') {
                return defaultPolygonRenderer(layer);
              }
              if (layer.type === 'point') {
                return defaultPointRenderer(layer);
              }
              if (layer.type === 'linestring') {
                return defaultLineRenderer(layer);
              }
            } else if (layer.renderer === 'choropleth') {
              if (layer.type === 'polygon') return choroplethPolygonRenderer(layer);
              if (layer.type === 'point') return choroplethPointRenderer(layer);
              if (layer.type === 'linestring') return choroplethLineRenderer(layer);
            }
            return null;
          }}
        </For>
        {/* Generate legend group for each layer */}
        <For each={ layersDescriptionStore.layers.toReversed() }>
          {(layer) => {
            if (layer.renderer === 'choropleth') {
              return legendChoropleth(layer);
            }
            return null;
          }}
        </For>
      </svg>
    </div>
  </div>;
}
