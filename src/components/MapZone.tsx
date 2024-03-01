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
import { applicationSettingsStore, RenderVisibility, ZoomBehavior } from '../store/ApplicationSettingsStore';
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
import smoothedMapRenderer from './MapRenderer/SmoothedMapRenderer.tsx';
import gridRenderer from './MapRenderer/GridRenderer.tsx';
import linksRenderer from './MapRenderer/LinksMapRenderer.tsx';

// - for rendering the layout features
import FreeDrawingRenderer from './LayoutFeatureRenderer/FreeDrawingRenderer.tsx';
import LineRenderer from './LayoutFeatureRenderer/LineRenderer.tsx';
import RectangleRenderer from './LayoutFeatureRenderer/RectangleRenderer.tsx';
import ScaleBarRenderer from './LayoutFeatureRenderer/ScaleBarRenderer.tsx';
import TextRenderer from './LayoutFeatureRenderer/TextRenderer.tsx';
import NorthArrowRenderer from './LayoutFeatureRenderer/NorthArrowRenderer.tsx';
import ImageRenderer from './LayoutFeatureRenderer/ImageRenderer.tsx';

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
  FreeDrawing,
  type IZoomable,
  LayoutFeatureType,
  Rectangle,
  ScaleBar,
  type LayerDescriptionCategoricalChoropleth,
  type LayerDescriptionChoropleth,
  type LayerDescriptionDiscontinuity,
  type LayerDescriptionGriddedLayer,
  type LayerDescriptionLabels,
  type LayerDescriptionLinks,
  type LayerDescriptionProportionalSymbols,
  type LayerDescriptionSmoothedLayer,
  type ID3Element,
  LayerDescription,
  Text,
  Line,
} from '../global.d';

// Styles
import '../styles/MapZone.css';

const layoutFeaturesFns = {
  [LayoutFeatureType.Line]: LineRenderer,
  [LayoutFeatureType.Rectangle]: RectangleRenderer,
  [LayoutFeatureType.FreeDrawing]: FreeDrawingRenderer,
  [LayoutFeatureType.ScaleBar]: ScaleBarRenderer,
  [LayoutFeatureType.Text]: TextRenderer,
  [LayoutFeatureType.NorthArrow]: NorthArrowRenderer,
  [LayoutFeatureType.Image]: ImageRenderer,
};

const dispatchLegendRenderer = (layer: LayerDescription) => {
  if (layer.renderer === 'choropleth') {
    return legendChoropleth(layer as LayerDescriptionChoropleth);
  }
  if (layer.renderer === 'categoricalChoropleth') {
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
  if (layer.renderer === 'smoothed') {
    return legendChoropleth(layer as LayerDescriptionSmoothedLayer);
  }
  if (layer.renderer === 'grid') {
    return legendChoropleth(layer as LayerDescriptionGriddedLayer);
  }
  return null;
};

const dispatchMapRenderer = (layer: LayerDescription) => {
  if (layer.renderer === 'sphere') {
    return sphereRenderer(layer);
  }
  if (layer.renderer === 'graticule') {
    return graticuleRenderer(layer);
  }
  if (layer.renderer === 'default' || layer.renderer === 'cartogram') {
    if (layer.type === 'polygon') return defaultPolygonRenderer(layer);
    if (layer.type === 'point') return defaultPointRenderer(layer);
    if (layer.type === 'linestring') return defaultLineRenderer(layer);
  } else if (layer.renderer === 'choropleth') {
    if (layer.type === 'polygon') return choroplethPolygonRenderer(layer as LayerDescriptionChoropleth);
    if (layer.type === 'point') return choroplethPointRenderer(layer as LayerDescriptionChoropleth);
    if (layer.type === 'linestring') return choroplethLineRenderer(layer as LayerDescriptionChoropleth);
  } else if (layer.renderer === 'categoricalChoropleth') {
    if (layer.type === 'polygon') return categoricalChoroplethPolygonRenderer(layer as LayerDescriptionCategoricalChoropleth);
    if (layer.type === 'point') return categoricalChoroplethPointRenderer(layer as LayerDescriptionCategoricalChoropleth);
    if (layer.type === 'linestring') return categoricalChoroplethLineRenderer(layer as LayerDescriptionCategoricalChoropleth);
  } else if (layer.renderer === 'proportionalSymbols') {
    return proportionalSymbolsRenderer(layer as LayerDescriptionProportionalSymbols);
  } else if (layer.renderer === 'labels') {
    if (layer.type === 'point') return defaultLabelsRenderer(layer as LayerDescriptionLabels);
  } else if (layer.renderer === 'discontinuity') {
    return discontinuityRenderer(layer as LayerDescriptionDiscontinuity);
  } else if (layer.renderer === 'smoothed') {
    return smoothedMapRenderer(layer as LayerDescriptionSmoothedLayer);
  } else if (layer.renderer === 'grid') {
    return gridRenderer(layer as LayerDescriptionGriddedLayer);
  } else if (layer.renderer === 'links') {
    return linksRenderer(layer as LayerDescriptionLinks);
  }
  return null;
};

export default function MapZone(): JSX.Element {
  let svgElem: SVGSVGElement & IZoomable;

  const { LL } = useI18nContext();

  // Set up the projection when the component is mounted
  const projection = d3[mapStore.projection.value as keyof typeof d3]()
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

  // Update the map store with the new scale and translate
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
  const applyZoomPan = (e: MouseEvent & d3.D3ZoomEvent<any, any>, redraw: boolean) => {
    if (!redraw) {
      const t = e.transform.toString();
      // We just change the transform attribute of the layers
      svgElem.querySelectorAll('g.layer').forEach((g: Element) => {
        // applyTransformTransition(g as SVGGElement, t, 100);
        g.setAttribute('transform', t);
      });
    } else {
      const lastTransform = svgElem.__zoom; // eslint-disable-line no-underscore-dangle
      // We need the previous projection scale, rotate and translate values
      // to compute the new ones
      const previousProjectionScale = mapStore.scale;
      const previousProjectionTranslate = mapStore.translate;
      const initialRotate = mapStore.rotate;

      // Compute new values for scale and translate from
      // the last zoom event
      const lastScale = lastTransform.k;
      const scaleValue = lastScale * previousProjectionScale;
      const translateValue = [
        lastTransform.x + previousProjectionTranslate[0] * lastScale,
        lastTransform.y + previousProjectionTranslate[1] * lastScale,
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
  }, 20);

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
      // Clicking on the map triggers a zoom event
      // but we don't want to redraw the map in this case
      if (e.transform.k === 1 && e.transform.x === 0 && e.transform.y === 0) {
        return;
      }
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
    // sel.on('click.zoom', (e) => { e.preventDefault(); e.stopPropagation(); });
    // sel.on('click', (e) => { e.preventDefault(); e.stopPropagation(); });
  });

  return <div class="map-zone">
    <div class="map-zone__inner">
      <svg
        ref={svgElem!}
        width={mapStore.mapDimensions.width}
        height={mapStore.mapDimensions.height}
        viewBox={`0 0 ${mapStore.mapDimensions.width} ${mapStore.mapDimensions.height}`}
        style={{
          'background-color': makeHexColorWithAlpha(mapStore.backgroundColor, mapStore.backgroundColorOpacity),
        }}
        class="map-zone__map"
        onContextMenu={(e) => e.preventDefault()}
        tabindex="0"
        aria-label="map zone"
      >
        <defs>
          <marker
            id="arrow-head"
            viewBox="0 -5 10 10"
            refX="5"
            refY="0"
            orient="auto"
            markerWidth="4"
            markerHeight="4"
            stroke="context-stroke"
            fill="context-stroke"
            // The two previous lines are used to
            // make the arrow head the same color as the line
            // but it only works in Firefox for now.
            // TODO: use reusable arrow path but clone the marker for each needed color
            //     <path id="markerPath" d="M0,-5L10,0L0,5" />
            //     <marker
            //        id="arrow-head-123" viewBox="0 -5 10 10"
            //        refX="5" refY="0" markerWidth="4" markerHeight="4" orient="auto"
            //        fill="the color of the arrow stroke"
            //        stroke="the color of the arrow stroke"
            //      >
            //       <use href="#markerPath" />
            //     </marker>
            //     // etc...
            style={{ 'stroke-width': '1px' }}
          >
            <path d="M0,-5L10,0L0,5" class="arrowHead"></path>
          </marker>
          <For each={layersDescriptionStore.layers}>
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
          {(layer) => <Show when={
              applicationSettingsStore.renderVisibility === RenderVisibility.RenderAsHidden
              || layer.visible
            }>{ dispatchMapRenderer(layer) }</Show>
          }
        </For>
        {/* Generate legend group for each layer */}
        <For each={ layersDescriptionStore.layers }>
          {(layer) => <Show when={
            applicationSettingsStore.renderVisibility === RenderVisibility.RenderAsHidden
            || (layer.visible && layer.legend?.visible)
            }>{ dispatchLegendRenderer(layer) }</Show>
          }
        </For>
        <For each={ layersDescriptionStore.layoutFeatures }>
          {(feature) => layoutFeaturesFns[feature.type](
            feature as Rectangle & FreeDrawing & ScaleBar & Text & Line,
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
