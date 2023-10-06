// Imports from solid-js
import { For, JSX, onMount } from 'solid-js';

// Imports from other packages
import d3 from '../helpers/d3-custom';

// Helpers
import { debounce } from '../helpers/common';
import { coordsPointOnFeature, redrawPaths } from '../helpers/geo';

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
import proportionalSymbolsRenderer from './MapRenderer/ProportionalSymbolsMapRenderer.tsx';

// Types and enums
import { IZoomable, ZoomBehavior } from '../global.d';

// Styles
import '../styles/MapZone.css';

export default function MapZone(): JSX.Element {
  let svgElem: SVGSVGElement & IZoomable;

  // Set up the map when the component is created
  setMapStore({
    scale: 160,
    translate: [mapStore.mapDimensions.width / 2, mapStore.mapDimensions.height / 2],
  });

  const projection = d3[mapStore.projection.value]()
    .translate(mapStore.translate)
    .scale(mapStore.scale);

  setGlobalStore({
    projection,
    pathGenerator: d3.geoPath(projection),
  });

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
      svgElem.querySelectorAll('g.layer').forEach((g: SVGGElement) => {
        g.setAttribute('transform', e.transform);
      });
    } else {
      // We need the previous projection scale, rotate and translate values
      // to compute the new ones
      const previousProjectionScale = mapStore.scale;
      const previousProjectionTranslate = mapStore.translate;
      const initialRotate = mapStore.rotate;

      // Compute new values for scale and translate from
      // the last zoom event
      const lastScale = e.transform.k;
      const scaleValue = lastScale * previousProjectionScale;
      const translateValue = [
        e.transform.x + previousProjectionTranslate[0] * lastScale,
        e.transform.y + previousProjectionTranslate[1] * lastScale,
      ];
      // Keep rotation value for now
      const rotateValue = initialRotate;

      // Update projection
      globalStore.projection
        .scale(scaleValue)
        .translate(translateValue)
        .rotate(rotateValue);

      setMapStore({
        scale: scaleValue,
        translate: translateValue,
      });

      // Actually redraw the paths and symbols
      redrawPaths(svgElem);
    }
  };

  // Debounce the applyZoomPan function to avoid redrawing the map
  // too often when zooming
  const redrawDebounced = debounce((e) => {
    applyZoomPan(e, true);
  }, 100);

  // Set up the zoom behavior
  const zoom = d3.zoom()
    .on('zoom', (e) => {
      if (mapStore.lockZoomPan) {
        // If zoom/pan is locked,
        // we just ensure that the __zoom property of the svg element
        // is set to the identity transform, so that the zoom/pan
        // does not change the map.
        svgElem.__zoom = d3.zoomIdentity; // eslint-disable-line no-underscore-dangle
      } else {
        // Otherwise we apply the zoom/pan
        applyZoomPan(e, false);
      }
    })
    .on('end', (e) => {
      if (mapStore.lockZoomPan) {
        svgElem.__zoom = d3.zoomIdentity; // eslint-disable-line no-underscore-dangle
      } else if (applicationSettingsStore.zoomBehavior === ZoomBehavior.Redraw) {
        redrawDebounced(e);
      }
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
            } else if (layer.renderer === 'proportionalSymbols') {
              return proportionalSymbolsRenderer(layer);
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
