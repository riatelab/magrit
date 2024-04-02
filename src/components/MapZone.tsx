// Imports from solid-js
import {
  For,
  type JSX,
  Match, onMount,
  Show, Switch,
} from 'solid-js';

// Imports from other packages
import {
  FiInfo,
  FiLock,
  FiMinusSquare,
  FiPlusSquare,
  FiUnlock,
} from 'solid-icons/fi';
import d3 from '../helpers/d3-custom';

// Helpers
import { makeHexColorWithAlpha } from '../helpers/color';
import { debounce } from '../helpers/common';
import { useI18nContext } from '../i18n/i18n-solid';
import { isLayoutFeature } from '../helpers/layoutFeatures';
import { findLayerById } from '../helpers/layers';

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
import mushroomRenderer from './MapRenderer/MushroomsMapRenderer.tsx';

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
import legendMushrooms from './LegendRenderer/MushroomsLegendRenderer.tsx';
import legendCategoricalChoroplethBarchart from './LegendRenderer/CategoricalChoroplethBarchartLegend.tsx';
import legendChoroplethHistogram from './LegendRenderer/ChoroplethHistogramLegend.tsx';

// Types and enums
import {
  type IZoomable,
  type ID3Element,
  type LayerDescription,
  type LayerDescriptionCategoricalChoropleth,
  type LayerDescriptionChoropleth,
  type LayerDescriptionDiscontinuity,
  type LayerDescriptionGriddedLayer,
  type LayerDescriptionLabels,
  type LayerDescriptionLinks,
  type LayerDescriptionMushroomLayer,
  type LayerDescriptionProportionalSymbols,
  type LayerDescriptionSmoothedLayer,
  LayoutFeatureType,
  type FreeDrawing,
  type LayoutFeature,
  type Line,
  type Rectangle,
  type ScaleBar,
  type Text,
  Legend,
  type CategoricalChoroplethBarchartLegend,
  type ChoroplethLegend,
  type ProportionalSymbolsLegend,
  type CategoricalChoroplethLegend,
  type DiscontinuityLegend,
  type LabelsLegend,
  type MushroomsLegend,
  type ChoroplethHistogramLegend,
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

const gatherArrowColors = (
  layers: LayerDescription[],
  layoutFeatures: LayoutFeature[],
): string[] => {
  // We need to go through all the layout features of type Line
  // and through all the layers of type links
  // to gather the color of all the lines with arrow heads
  const arrowColors = new Set<string>();
  layers.forEach((layer) => {
    if (layer.renderer === 'links') {
      const linksParams = (layer as LayerDescriptionLinks).rendererParameters;
      if (linksParams.head === 'Arrow' || linksParams.head === 'ArrowOnSymbol') {
        arrowColors.add(layer.strokeColor!);
      }
    }
  });
  layoutFeatures.forEach((feature) => {
    if (feature.type === LayoutFeatureType.Line) {
      const line = feature as Line;
      if (line.arrow) {
        arrowColors.add(line.strokeColor);
      }
    }
  });
  return Array.from(arrowColors);
};

const dispatchLegendRenderer = (legend: Legend) => {
  if (legend.type === 'choropleth') {
    return legendChoropleth(legend as ChoroplethLegend);
  }
  if (legend.type === 'categoricalChoropleth') {
    return legendCategoricalChoropleth(legend as CategoricalChoroplethLegend);
  }
  if (legend.type === 'proportional') {
    return legendProportionalSymbols(legend as ProportionalSymbolsLegend);
  }
  if (legend.type === 'discontinuity') {
    return legendDiscontinuity(legend as DiscontinuityLegend);
  }
  if (legend.type === 'labels') {
    return legendLabels(legend as LabelsLegend);
  }
  if (legend.type === 'mushrooms') {
    return legendMushrooms(legend as MushroomsLegend);
  }
  if (legend.type === 'categoricalChoroplethBarchart') {
    return legendCategoricalChoroplethBarchart(legend as CategoricalChoroplethBarchartLegend);
  }
  if (legend.type === 'choroplethHistogram') {
    return legendChoroplethHistogram(legend as ChoroplethHistogramLegend);
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
  } else if (layer.renderer === 'mushrooms') {
    return mushroomRenderer(layer as LayerDescriptionMushroomLayer);
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
    el.__data__ = { type: 'Sphere' } as never;
    return <clipPath id="clip-sphere">{ el }</clipPath>;
  };

  const handleClickZoom = (direction: number) => {
    // How much we want to zoom in/out
    const factor = 0.15;
    // We zoom in/out on the axis of the centre of the map
    // (i.e the center of the container, not the center of the data)
    const center = [
      mapStore.mapDimensions.width / 2,
      mapStore.mapDimensions.height / 2,
    ];

    // The new transform object we are building
    const view = {
      x: mapStore.translate[0],
      y: mapStore.translate[1],
      k: mapStore.scale,
    };
    // Compute new k value
    view.k = mapStore.scale * (1 + factor * direction);
    // Compute new x and y values
    const translate0 = [
      (center[0] - mapStore.translate[0]) / mapStore.scale,
      (center[1] - mapStore.translate[1]) / mapStore.scale,
    ];
    view.x += center[0] - (translate0[0] * view.k + view.x);
    view.y += center[1] - (translate0[1] * view.k + view.y);

    // Update mapstore with the new values
    setMapStore({
      scale: view.k,
      translate: [view.x, view.y],
    });
  };
  const handleClickZoomIn = () => {
    if (mapStore.lockZoomPan) return;
    handleClickZoom(1);
  };
  const handleClickZoomOut = () => {
    if (mapStore.lockZoomPan) return;
    handleClickZoom(-1);
  };

  const handleMouseInfo = () => {

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
          <path id="arrow-head-marker-path" d="M0,-5L10,0L0,5"/>
          <For each={
            gatherArrowColors(
              layersDescriptionStore.layers,
              layersDescriptionStore.layoutFeaturesAndLegends
                .filter(isLayoutFeature) as LayoutFeature[],
            )
          }>
            {
              (color) => <marker
                id={`arrow-head-${color.replace('#', '')}`} viewBox="0 -5 10 10"
                refX="5" refY="0"
                markerWidth="4"
                markerHeight="4"
                orient="auto-start-reverse"
                fill={color}
                stroke={color}
              >
                <use href="#arrow-head-marker-path"/>
              </marker>
            }
          </For>
          <For each={layersDescriptionStore.layers}>
            {(layer) => <>
              {/*
                For now we need a workaround issue https://github.com/solidjs/solid/issues/2110
                regarding the stdDeviation attribute of the feDropShadow filter,
                that's why we use spread operator to pass the stdDeviation attribute.
              */}
              <Show when={layer.visible && !!layer.dropShadow}>
                <filter id={`filter-drop-shadow-${layer.id}`} width="200%" height="200%">
                  <feDropShadow
                    dx={layer.dropShadow!.dx}
                    dy={layer.dropShadow!.dy}
                    {...{ stdDeviation: layer.dropShadow!.stdDeviation }}
                    flood-color={layer.dropShadow!.color}
                    flood-opacity={1}
                  />
                </filter>
              </Show>
            </>
            }
          </For>
          {getClipSphere()}
        </defs>

        {/* Generate SVG group for each layer */}
        <For each={layersDescriptionStore.layers}>
        {(layer) => <Show when={
              applicationSettingsStore.renderVisibility === RenderVisibility.RenderAsHidden
              || layer.visible
            }>{ dispatchMapRenderer(layer) }</Show>
          }
        </For>
        <For each={ layersDescriptionStore.layoutFeaturesAndLegends }>
          {
            (elem) => {
              if (isLayoutFeature(elem)) {
                return layoutFeaturesFns[(elem as LayoutFeature).type](
                  elem as Rectangle & FreeDrawing & ScaleBar & Text & Line,
                );
              }
              // If the element is a legend, we dispatch the legend renderer
              return <Show when={
                applicationSettingsStore.renderVisibility === RenderVisibility.RenderAsHidden
                || (
                  (elem as Legend).visible
                  && findLayerById(layersDescriptionStore.layers, (elem as Legend).layerId)!.visible
                )
              }>{ dispatchLegendRenderer(elem as Legend) }</Show>;
            }}
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
    <div class="field has-addons map-zone__controls">
      <p class="control">
        <button
          class="button"
          onClick={handleClickZoomIn}
          aria-label={LL().MapZone.Controls.Plus()}
          title={LL().MapZone.Controls.Plus()}
        >
          <FiPlusSquare size={'1.5em'} />
        </button>
      </p>
      <p class="control">
        <button
          class="button"
          onClick={handleClickZoomOut}
          aria-label={LL().MapZone.Controls.Minus()}
          title={LL().MapZone.Controls.Minus()}
        >
          <FiMinusSquare size={'1.5em'} />
        </button>
      </p>
      <p class="control">
        <Switch>
          <Match when={!mapStore.lockZoomPan}>
            <button
              class="button"
              onClick={() => { setMapStore({ lockZoomPan: true }); }}
              aria-label={LL().MapZone.Controls.Lock()}
              title={LL().MapZone.Controls.Lock()}
            >
              <FiUnlock size={'1.5em'} />
            </button>
          </Match>
          <Match when={mapStore.lockZoomPan}>
            <button
              class="button"
              onClick={() => { setMapStore({ lockZoomPan: false }); }}
              aria-label={LL().MapZone.Controls.Unlock()}
              title={LL().MapZone.Controls.Unlock()}
            >
              <FiLock size={'1.5em'} />
            </button>
          </Match>
        </Switch>
      </p>
      <p class="control">
        <button
          class="button"
          aria-label={LL().MapZone.Controls.Info()}
          title={LL().MapZone.Controls.Info()}
          onClick={handleMouseInfo}
        >
          <FiInfo size={'1.5em'} />
        </button>
      </p>
    </div>
  </div>;
}
