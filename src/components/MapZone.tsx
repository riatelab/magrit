// Imports from solid-js
import { For, JSX, onMount } from 'solid-js';

// Imports from other packages
import d3 from '../helpers/d3-custom';

// Helpers
import { debounce } from '../helpers/common';

// Stores
import { globalStore, setGlobalStore } from '../store/GlobalStore';
import { layersDescriptionStore } from '../store/LayersDescriptionStore';
import { applicationSettingsStore } from '../store/ApplicationSettingsStore';
import { mapStore, setMapStore } from '../store/MapStore';

// Sub-components
import {
  defaultLineRenderer,
  defaultPointRenderer,
  defaultPolygonRenderer,
  sphereRenderer,
} from './MapRenderer/DefaultMapRenderer.tsx';
import {
  choroplethLineRenderer,
  choroplethPointRenderer,
  choroplethPolygonRenderer,
} from './MapRenderer/ChoroplethMapRenderer.tsx';
import legendChoropleth from './LegendRenderer/ChoroplethLegend.tsx';

// Types and enums
import { ZoomBehavior } from '../global.d';

// Styles
import '../styles/MapZone.css';

export default function MapZone(): JSX.Element {
  let svgElem;

  // Set up the map when the component is created
  const initialScale = 160;
  const initialTranslate = [mapStore.mapDimensions.width / 2, mapStore.mapDimensions.height / 2];

  setMapStore({
    scale: initialScale,
    translate: initialTranslate,
  });

  const projection = d3[mapStore.projection.value]()
    .translate(mapStore.translate)
    .scale(mapStore.scale);

  const pathGenerator = d3.geoPath(projection);

  setGlobalStore(
    'projection',
    () => projection,
  );

  setGlobalStore(
    'pathGenerator',
    () => pathGenerator,
  );

  // When applyZoomPan is called with redraw = false,
  // the map is not redrawn, but we set the 'transform' attribute
  // of the layers to the current transform value.
  // When applyZoomPan is called with redraw = true,
  // we change the projection scale and translate values
  // so that the map paths are redrawn with the new values (the map
  // should not change visually, so we need to use
  // the values used in the transform attribute up to now
  // and remove the transform attribute from the elements on
  // which it was defined).
  const applyZoomPan = (e, redraw: boolean) => {
    if (!redraw) {
      // We just change the transform attribute of the layers
      svgElem.querySelectorAll('g.layer').forEach((g) => {
        g.setAttribute('transform', e.transform);
      });
    } else {
      // We change the projection scale and translate values
      const proj = globalStore.projection;
      const previousProjectionScale = mapStore.scale;
      const previousProjectionTranslate = mapStore.translate;
      // const initialRotate = mapStore.rotate;

      // Parse last transform from svg element
      const lastTransform = svgElem.querySelector('g.layer').getAttribute('transform');
      const lastTranslate = lastTransform.match(/translate\(([^)]+)\)/)[1].split(',').map((d) => +d);
      const lastScale = +lastTransform.match(/scale\(([^)]+)\)/)[1];

      // Compute new values for scale and translate
      const scaleValue = lastScale * previousProjectionScale;
      const translateValue = [
        lastTranslate[0] + previousProjectionTranslate[0] * lastScale,
        lastTranslate[1] + previousProjectionTranslate[1] * lastScale,
      ];
      // Keep rotation value
      const rotateValue = proj.rotate();

      // Update projection
      proj.scale(scaleValue)
        .translate(translateValue)
        .rotate(rotateValue);

      // We also need to reset the __zoom property of the svg element
      // to the new values, otherwise the zoom will not work anymore.
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
      });
    }
  };

  // Debounce the applyZoomPan function to avoid redrawing the map
  // too often when zooming
  const redrawDebounced = debounce((e) => {
    applyZoomPan(e, true);
  }, 650);

  // Set up the zoom behavior
  const zoom = d3.zoom()
    .on('zoom', (e) => {
      applyZoomPan(e, false);
    })
    .on('zoom.end', (e) => {
      if (applicationSettingsStore.zoomBehavior === ZoomBehavior.Redraw) redrawDebounced(e);
    });

  const getClipSphere = () => {
    const el = <path d={globalStore.pathGenerator({ type: 'Sphere' })} />;
    // eslint-disable-next-line no-underscore-dangle
    el.__data__ = { type: 'Sphere' };
    return <clipPath id="clip-sphere">{ el }</clipPath>;
  };

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
          <For each={ layersDescriptionStore.layers.toReversed() }>
            {(layer) => {
              if (layer.dropShadow) {
                return <filter id={`filter-drop-shadow-${layer.id}`} width="200%" height="200%">
                  <feOffset result="offOut" in="SourceAlpha" dx="5" dy="5" />
                  <feGaussianBlur result="blurOut" in="offOut" stdDeviation="10" />
                  <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
                </filter>;
              }
              return null;
            }}
          </For>
          { getClipSphere() }
        </defs>

        {/* Generate SVG group for each layer */}
        <For each={ layersDescriptionStore.layers.toReversed() }>
          {(layer) => {
            if (layer.renderer === 'sphere') {
              return sphereRenderer(layer);
            }
            if (layer.renderer === 'default') {
              if (layer.type === 'polygon') return defaultPolygonRenderer(layer);
              if (layer.type === 'point') return defaultPointRenderer(layer);
              if (layer.type === 'linestring') return defaultLineRenderer(layer);
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
