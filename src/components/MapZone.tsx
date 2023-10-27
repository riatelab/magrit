// Imports from solid-js
import { For, JSX, onMount } from 'solid-js';

// Imports from other packages
import d3 from '../helpers/d3-custom';

// Helpers
import { debounce } from '../helpers/common';
import { makeHexColorWithAlpha } from '../helpers/color';

// Stores
import { globalStore, setGlobalStore } from '../store/GlobalStore';
import { layersDescriptionStore } from '../store/LayersDescriptionStore';
import { applicationSettingsStore } from '../store/ApplicationSettingsStore';
import { mapStore, setMapStore, setMapStoreBase } from '../store/MapStore';

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
import graticuleRenderer from './MapRenderer/GraticuleRenderer.tsx';
import RectangleRenderer from './LayoutFeatureRenderer/RectangleRenderer.tsx';
import EllipseRenderer from './LayoutFeatureRenderer/EllipseRenderer.tsx';
import FreeDrawingRenderer from './LayoutFeatureRenderer/FreeDrawingRenderer.tsx';
import ScaleBarRenderer from './LayoutFeatureRenderer/ScaleBarRenderer.tsx';

// Types and enums
import {
  Ellipse, FreeDrawing, type IZoomable, LayoutFeatureType,
  Rectangle, ZoomBehavior, ScaleBar,
} from '../global.d';

// Styles
import '../styles/MapZone.css';
import legendProportionalSymbols from './LegendRenderer/ProportionnalSymbolsLegend.tsx';

const layoutFeaturesFns = {
  [LayoutFeatureType.Rectangle]: RectangleRenderer,
  [LayoutFeatureType.Ellipse]: EllipseRenderer,
  [LayoutFeatureType.FreeDrawing]: FreeDrawingRenderer,
  [LayoutFeatureType.ScaleBar]: ScaleBarRenderer,
};

export default function MapZone(): JSX.Element {
  let svgElem: SVGSVGElement & IZoomable;

  // Set up the map when the component is created
  setMapStoreBase({
    scale: 160,
    translate: [mapStore.mapDimensions.width / 2, mapStore.mapDimensions.height / 2],
  });

  const projection = d3[mapStore.projection.value]()
    .translate(mapStore.translate)
    .scale(mapStore.scale)
    .clipExtent([
      [-100, -100],
      [mapStore.mapDimensions.width + 100, mapStore.mapDimensions.height + 100],
    ]);

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
      // Keep rotation value unchanged for now
      const rotateValue = initialRotate;

      // Update the projection properties in the mapStore - this
      // will update the 'projection' entry in the global store
      // and redraw the map
      setMapStore({
        scale: scaleValue,
        translate: translateValue,
        rotate: rotateValue,
      });
    }
  };

  // Debounce the applyZoomPan function to avoid redrawing the map
  // too often when zooming
  const redrawDebounced = debounce((e) => {
    applyZoomPan(e, true);
  }, 25);

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
    // The SVG element as a d3 selection
    const sel = d3.select(svgElem);
    // Apply the zoom behavior to the SVG element
    zoom.apply(null, [sel]);
    // Remove the default double-click zoom behavior
    sel.on('dblclick.zoom', null);
  });

  return <div class="map-zone">
    <div class="map-zone__inner">
      <svg
        ref={svgElem}
        width={mapStore.mapDimensions.width}
        height={mapStore.mapDimensions.height}
        style={{
          'background-color': makeHexColorWithAlpha(mapStore.backgroundColor, mapStore.backgroundColorOpacity),
        }}
        class="map-zone__map"
        onContextMenu={(e) => e.preventDefault()}
      >
        <defs>
          <For each={ layersDescriptionStore.layers }>
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
        <For each={ layersDescriptionStore.layers }>
          {(layer) => {
            if (layer.renderer === 'sphere') {
              return sphereRenderer(layer);
            }
            if (layer.renderer === 'graticule') {
              return graticuleRenderer(layer);
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
        <For each={ layersDescriptionStore.layers }>
          {(layer) => {
            if (layer.renderer === 'choropleth') {
              return legendChoropleth(layer);
            }
            if (layer.renderer === 'proportionalSymbols') {
              return legendProportionalSymbols(layer);
            }
            return null;
          }}
        </For>
        <For each={ layersDescriptionStore.layoutFeatures }>
          {(feature) => layoutFeaturesFns[feature.type](
            feature as Rectangle & Ellipse & FreeDrawing & ScaleBar,
          )}
        </For>
      </svg>
    </div>
  </div>;
}
