// Imports from solid-js
import {
  For,
  JSX,
  onMount,
  Show,
} from 'solid-js';

// Imports from other packages
import d3 from '../helpers/d3-custom';

// Helpers
import { makeHexColorWithAlpha } from '../helpers/color';
import { debounce } from '../helpers/common';
import { useI18nContext } from '../i18n/i18n-solid';

// Stores
import { globalStore, setGlobalStore } from '../store/GlobalStore';
import { layersDescriptionStore } from '../store/LayersDescriptionStore';
import { applicationSettingsStore, ZoomBehavior } from '../store/ApplicationSettingsStore';
import {
  getDefaultClipExtent,
  mapStore,
  setMapStore,
} from '../store/MapStore';

// Sub-components
// - for rendering the layers
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
import proportionalSymbolsRenderer from './MapRenderer/ProportionalSymbolsMapRenderer.tsx';
import discontinuityRenderer from './MapRenderer/DiscontinuityMapRenderer.tsx';
import { defaultLabelsRenderer } from './MapRenderer/LabelsMapRenderer.tsx';
import graticuleRenderer from './MapRenderer/GraticuleRenderer.tsx';

// - for rendering the layout features
import RectangleRenderer from './LayoutFeatureRenderer/RectangleRenderer.tsx';
import EllipseRenderer from './LayoutFeatureRenderer/EllipseRenderer.tsx';
import FreeDrawingRenderer from './LayoutFeatureRenderer/FreeDrawingRenderer.tsx';
import ScaleBarRenderer from './LayoutFeatureRenderer/ScaleBarRenderer.tsx';

// - for rendering the legends
import legendChoropleth from './LegendRenderer/ChoroplethLegend.tsx';
import legendProportionalSymbols from './LegendRenderer/ProportionnalSymbolsLegend.tsx';
import legendDiscontinuity from './LegendRenderer/DiscontinuityLegendRenderer.tsx';
import {
  categoricalChoroplethLineRenderer,
  categoricalChoroplethPointRenderer,
  categoricalChoroplethPolygonRenderer,
} from './MapRenderer/CategoricalChoroplethMapRenderer.tsx';
import legendCategoricalChoropleth from './LegendRenderer/CategoricalChoroplethLegend.tsx';
import legendLabels from './LegendRenderer/LabelsLegendRenderer.tsx';

// Types and enums
import {
  Ellipse,
  FreeDrawing,
  type IZoomable,
  LayoutFeatureType,
  Rectangle,
  ScaleBar,
  type LayerDescriptionChoropleth,
  type LayerDescriptionDiscontinuity,
  type LayerDescriptionProportionalSymbols,
  type LayerDescriptionLabels,
  type ID3Element, LayerDescriptionCategoricalChoropleth,
} from '../global.d';

// Styles
import '../styles/MapZone.css';

const layoutFeaturesFns = {
  [LayoutFeatureType.Rectangle]: RectangleRenderer,
  [LayoutFeatureType.Ellipse]: EllipseRenderer,
  [LayoutFeatureType.FreeDrawing]: FreeDrawingRenderer,
  [LayoutFeatureType.ScaleBar]: ScaleBarRenderer,
};

export default function MapZone(): JSX.Element {
  let svgElem: SVGSVGElement & IZoomable;

  const { LL } = useI18nContext();

  // Set up the projection when the component is mounted
  const projection = d3[mapStore.projection.value]()
    .translate([mapStore.mapDimensions.width / 2, mapStore.mapDimensions.height / 2])
    .scale(160)
    .clipExtent(getDefaultClipExtent());

  // Zoom the map on the sphere when the component is mounted
  projection.fitExtent(
    [
      [
        mapStore.mapDimensions.width * 0.1,
        mapStore.mapDimensions.height * 0.1,
      ],
      [
        mapStore.mapDimensions.width - mapStore.mapDimensions.width * 0.1,
        mapStore.mapDimensions.height - mapStore.mapDimensions.height * 0.1,
      ],
    ],
    { type: 'Sphere' },
  );

  // Store the projection and the pathGenerator in the global store
  setGlobalStore({
    projection,
    pathGenerator: d3.geoPath(projection),
  });

  // Store the map store with the new scale and translate
  setMapStore({
    scale: globalStore.projection.scale(),
    translate: globalStore.projection.translate(),
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
      svgElem.querySelectorAll('g.layer').forEach((g: Element) => {
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
    const el = <path d={globalStore.pathGenerator({ type: 'Sphere' })} /> as JSX.Element & ID3Element;
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
            {(layer) => <>
                <Show when={layer.dropShadow}>
                  <filter id={`filter-drop-shadow-${layer.id}`} width="200%" height="200%">
                    <feDropShadow dx="5" dy="5" stdDeviation="0" />
                    {/* TODO: investigate the various ways of drawing drop shadows */}
                    {/* <feOffset result="offOut" in="SourceAlpha" dx="5" dy="5" /> */}
                    {/* <feGaussianBlur result="blurOut" in="offOut" stdDeviation="10" /> */}
                    {/* <feBlend in="SourceGraphic" in2="blurOut" mode="normal" /> */}
                  </filter>
                </Show>
                <Show when={layer.blurFilter}>
                  <filter id={`filter-blur-${layer.id}`}>
                    <feGaussianBlur stdDeviation="5" />
                  </filter>
                </Show>
              </>
            }
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
              if (layer.type === 'polygon') return choroplethPolygonRenderer(layer as LayerDescriptionChoropleth);
              if (layer.type === 'point') return choroplethPointRenderer(layer as LayerDescriptionChoropleth);
              if (layer.type === 'linestring') return choroplethLineRenderer(layer as LayerDescriptionChoropleth);
            } else if (layer.renderer === 'categorical') {
              if (layer.type === 'polygon') return categoricalChoroplethPolygonRenderer(layer as LayerDescriptionCategoricalChoropleth);
              if (layer.type === 'point') return categoricalChoroplethPointRenderer(layer as LayerDescriptionCategoricalChoropleth);
              if (layer.type === 'linestring') return categoricalChoroplethLineRenderer(layer as LayerDescriptionCategoricalChoropleth);
            } else if (layer.renderer === 'proportionalSymbols') {
              return proportionalSymbolsRenderer(layer as LayerDescriptionProportionalSymbols);
            } else if (layer.renderer === 'labels') {
              if (layer.type === 'point') return defaultLabelsRenderer(layer as LayerDescriptionLabels);
            } else if (layer.renderer === 'discontinuity') {
              return discontinuityRenderer(layer as LayerDescriptionDiscontinuity);
            }
            return null;
          }}
        </For>
        {/* Generate legend group for each layer */}
        <For each={ layersDescriptionStore.layers }>
          {(layer) => {
            if (layer.renderer === 'choropleth') {
              return legendChoropleth(layer as LayerDescriptionChoropleth);
            }
            if (layer.renderer === 'categorical') {
              return legendCategoricalChoropleth(layer as LayerDescriptionCategoricalChoropleth);
            }
            if (layer.renderer === 'proportionalSymbols') {
              return legendProportionalSymbols(layer as LayerDescriptionProportionalSymbols);
            }
            if (layer.renderer === 'discontinuity') {
              return legendDiscontinuity(layer as LayerDescriptionDiscontinuity);
            }
            if (layer.renderer === 'labels') {
              return legendLabels(layer as LayerDescriptionLabels);
            }
            return null;
          }}
        </For>
        <For each={ layersDescriptionStore.layoutFeatures }>
          {(feature) => layoutFeaturesFns[feature.type](
            feature as Rectangle & Ellipse & FreeDrawing & ScaleBar,
          )}
        </For>
        <Show when={!globalStore.userHasAddedLayer}>
          <foreignObject
            x={0} y={0}
            width={mapStore.mapDimensions.width} height={mapStore.mapDimensions.height}
          >
            <div
              class="map-zone__inner-placeholder is-flex is-justify-content-center is-align-content-center"
              style={{ 'flex-wrap': 'wrap', height: '100%' }}
            >
              <p>{ LL().MapZone.DropFilesHere() }</p>
            </div>
          </foreignObject>
        </Show>
      </svg>
    </div>
  </div>;
}
