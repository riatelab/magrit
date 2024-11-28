// Imports from solid-js
import {
  createEffect,
  For, type JSX,
  Match, on, onMount,
  Show, Switch,
} from 'solid-js';

// Imports from other packages
import interact from 'interactjs';
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
import { throttle } from '../helpers/common';
import { useI18nContext } from '../i18n/i18n-solid';
import { isLayoutFeature } from '../helpers/layoutFeatures';
import { findLayerById } from '../helpers/layers';
import { Mround } from '../helpers/math';
import draw from '../helpers/canvas';

// Stores
import { globalStore, setGlobalStore } from '../store/GlobalStore';
import { layersDescriptionStore } from '../store/LayersDescriptionStore';
import { applicationSettingsStore, RenderVisibility, ZoomBehavior } from '../store/ApplicationSettingsStore';
import {
  getDefaultClipExtent,
  mapStore,
  setMapStore,
  setMapStoreBase,
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
import {
  proportionalSymbolsLinearRenderer,
  proportionalSymbolsPunctualRenderer,
} from './MapRenderer/ProportionalSymbolsMapRenderer.tsx';
import discontinuityRenderer from './MapRenderer/DiscontinuityMapRenderer.tsx';
import { defaultLabelsRenderer } from './MapRenderer/LabelsMapRenderer.tsx';
import graticuleRenderer from './MapRenderer/GraticuleRenderer.tsx';
import smoothedMapRenderer from './MapRenderer/SmoothedMapRenderer.tsx';
import gridRenderer from './MapRenderer/GridRenderer.tsx';
import linksRenderer from './MapRenderer/LinksMapRenderer.tsx';
import mushroomRenderer from './MapRenderer/MushroomsMapRenderer.tsx';
import categoricalPictogramRenderer from './MapRenderer/CategoricalPictogramMapRenderer.tsx';
import waffleRenderer from './MapRenderer/WaffleMapRenderer.tsx';

// - for rendering the layout features
import FreeDrawingRenderer from './LayoutFeatureRenderer/FreeDrawingRenderer.tsx';
import LineRenderer from './LayoutFeatureRenderer/LineRenderer.tsx';
import RectangleRenderer from './LayoutFeatureRenderer/RectangleRenderer.tsx';
import ScaleBarRenderer from './LayoutFeatureRenderer/ScaleBarRenderer.tsx';
import TextRenderer from './LayoutFeatureRenderer/TextRenderer.tsx';
import NorthArrowRenderer from './LayoutFeatureRenderer/NorthArrowRenderer.tsx';
import ImageRenderer from './LayoutFeatureRenderer/ImageRenderer.tsx';

// - for rendering the legends
import legendDefault from './LegendRenderer/DefaultLegendRenderer.tsx';
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
import lmScatterPlot from './LegendRenderer/LMScatterPlotRenderer.tsx';
import legendCategoricalPictogram from './LegendRenderer/CategoricalPictogramLegendRenderer.tsx';
import legendWaffle from './LegendRenderer/WaffleLegendRenderer.tsx';

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
  type Legend,
  type DefaultLegend,
  type CategoricalChoroplethBarchartLegend,
  type ChoroplethLegend,
  type ProportionalSymbolsLegend,
  type CategoricalChoroplethLegend,
  type CategoricalPictogramLegend,
  type DiscontinuityLegend,
  type LabelsLegend,
  type LinearRegressionScatterPlot,
  type MushroomsLegend,
  type ChoroplethHistogramLegend,
  type LayerDescriptionCategoricalPictogram,
  type LayerDescriptionWaffle,
  type WaffleLegend,
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
    if (layer.representationType === 'links') {
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
  if (legend.type === 'default') {
    return legendDefault(legend as DefaultLegend);
  }
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
  if (legend.type === 'linearRegressionScatterPlot') {
    return lmScatterPlot(legend as LinearRegressionScatterPlot);
  }
  if (legend.type === 'categoricalPictogram') {
    return legendCategoricalPictogram(legend as CategoricalPictogramLegend);
  }
  if (legend.type === 'waffle') {
    return legendWaffle(legend as WaffleLegend);
  }
  return null;
};

const makeMapResizable = (refMapShadow: HTMLDivElement) => {
  let currentLock: boolean;
  let initialShadowRect: DOMRect;
  interact('.map-zone__inner')
    .resizable({
      // Resize from all edges and corners
      edges: {
        left: true, right: true, bottom: true, top: true,
      },
      // Don't start resizing if the user seems to want to interact
      // with a legend, a layout feature or one of the various draggable
      // elements (labels, proportional symbols, etc.)
      ignoreFrom: 'g.legend, g.layout-feature, text, circle, rect, image',
      listeners: {
        start() {
          // eslint-disable-next-line no-param-reassign
          refMapShadow.style.display = 'block';
          initialShadowRect = refMapShadow.getBoundingClientRect();
          currentLock = mapStore.lockZoomPan;
          setMapStoreBase('lockZoomPan', true);
        },
        move(event) {
          // Since we are centering the map in its container, we need to
          // compute the new position of the shadow div.
          // By default, it looks like we are resizing two times slower
          // than what the cursor does
          if (event.edges.top || event.edges.bottom) {
            const dh = initialShadowRect.height - event.rect.height;
            const h = initialShadowRect.height - dh * 2;
            // eslint-disable-next-line no-param-reassign
            refMapShadow.style.top = `${(globalStore.windowDimensions.height - h - globalStore.headerHeight) / 2}px`;
            // eslint-disable-next-line no-param-reassign
            refMapShadow.style.height = `${h}px`;
          }

          if (event.edges.left || event.edges.right) {
            const dw = initialShadowRect.width - event.rect.width;
            const w = initialShadowRect.width - dw * 2;
            // eslint-disable-next-line no-param-reassign
            refMapShadow.style.left = `${(globalStore.windowDimensions.width - w - globalStore.leftMenuWidth) / 2}px`;
            // eslint-disable-next-line no-param-reassign
            refMapShadow.style.width = `${w}px`;
          }
        },
        end(event) {
          const boundingRect = refMapShadow.getBoundingClientRect();
          // We need to compute the difference in size between the shadow div
          // and the map div, we will shift the map content by half of this difference
          if (
            (event.edges.top || event.edges.bottom)
            && (event.edges.left || event.edges.right)
          ) {
            const dw = initialShadowRect.width - boundingRect.width - 1;
            const dh = initialShadowRect.height - boundingRect.height;
            // Update map dimensions
            setMapStore({
              mapDimensions: {
                width: Mround(boundingRect.width - 3),
                height: Mround(boundingRect.height - 4),
              },
              lockZoomPan: currentLock || false,
              translate: [
                mapStore.translate[0] - dw / 2,
                mapStore.translate[1] - dh / 2,
              ],
            });
          } else if (event.edges.top || event.edges.bottom) {
            const dh = initialShadowRect.height - boundingRect.height;
            // Update map dimensions
            setMapStore({
              mapDimensions: {
                width: mapStore.mapDimensions.width,
                height: Mround(boundingRect.height - 4),
              },
              lockZoomPan: currentLock || false,
              translate: [
                mapStore.translate[0],
                mapStore.translate[1] - dh / 2,
              ],
            });
          } else if (event.edges.left || event.edges.right) {
            const dw = initialShadowRect.width - boundingRect.width - 1;
            // Update map dimensions
            setMapStore({
              mapDimensions: {
                width: Mround(boundingRect.width - 3),
                height: mapStore.mapDimensions.height,
              },
              lockZoomPan: currentLock || false,
              translate: [
                mapStore.translate[0] - dw / 2,
                mapStore.translate[1],
              ],
            });
          }
          // eslint-disable-next-line no-param-reassign
          refMapShadow.style.display = 'none';
        },
      },
      modifiers: [
        // keep the edges inside the parent
        interact.modifiers.restrictEdges({
          outer: 'parent',
        }),
        // minimum size
        interact.modifiers.restrictSize({
          min: { width: 100, height: 50 },
        }),
      ],
    });
};

/**
 * We want a map component that will be a drop-in replacement for the MapZone component.
 * This component will be a canvas-based map (for the rendering of the layers) with an SVG overlay
 * (for the rendering of the layout features and legends).
 * The canvas will be used to render the layers because it is faster than SVG for rendering
 * a lot of elements.
 * The SVG overlay will be used to render the layout features and legends because it is easier
 * to interact with SVG elements.
 *
 * @constructor
 */
export default function MapZoneCanvas(): JSX.Element {
  let svgElem: SVGSVGElement & IZoomable;
  let canvasElem: HTMLCanvasElement;
  let refMapShadow: HTMLDivElement;
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
  setMapStoreBase({
    scale: globalStore.projection.scale(),
    translate: globalStore.projection.translate(),
  });

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
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    // resetInfoFeature();
    handleClickZoom(1);
  };

  const handleClickZoomOut = () => {
    if (mapStore.lockZoomPan) return;
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    // resetInfoFeature();
    handleClickZoom(-1);
  };

  const makeMapZoomable = (/* svgElem: SVGSVGElement & IZoomable */) => {
    const previous = { x: 0, y: 0, k: 1 };
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
    const applyZoomPan = (e: MouseEvent & d3.D3ZoomEvent<any, any>) => {
      const lastTransform = e.transform; // eslint-disable-line no-underscore-dangle
      // We need the previous projection scale, rotate and translate values
      // to compute the new ones
      /* eslint-disable no-underscore-dangle */
      const previousProjectionScale = mapStore.scale;
      const previousProjectionTranslate = mapStore.translate;
      /* eslint-enable no-underscore-dangle */
      // const initialRotate = mapStore.rotate;

      // Compute new values for scale and translate from
      // the last zoom event
      const lastScale = lastTransform.k;
      const scaleValue = (lastScale * previousProjectionScale);
      const translateValue = previous.k === 1
        ? [
          (lastTransform.x - previous.x + previousProjectionTranslate[0] * lastScale),
          (lastTransform.y - previous.y + previousProjectionTranslate[1] * lastScale),
        ]
        : [
          (lastTransform.x + previousProjectionTranslate[0] * lastScale),
          (lastTransform.y + previousProjectionTranslate[1] * lastScale),
        ];

      // Update the projection properties in the mapStore - this
      // will update the 'projection' entry in the global store
      // and redraw the map
      setMapStoreBase({
        scale: scaleValue,
        translate: translateValue,
      });
      // setMapStore({
      //   scale: lastTransform.k,
      //   translate: [lastTransform.x, lastTransform.y],
      // });

      svgElem!.__zoom = d3.zoomIdentity; // eslint-disable-line no-underscore-dangle
    };

    const applyZoomPanDebounced = throttle((e) => {
      console.log('inside throttled');
      applyZoomPan(e);
      previous.x = e.transform.x;
      previous.y = e.transform.y;
      previous.k = e.transform.k;
    }, 100, false);

    /* eslint-disable no-underscore-dangle, no-param-reassign */
    // Set up the zoom behavior
    const zoom = d3.zoom()
      .on('start', () => {
        previous.x = 0;
        previous.y = 0;
        previous.k = 1;
      })
      .on('zoom', (e) => {
        console.log('is zooming');
        applyZoomPanDebounced(e);
      })
      .on('end', (e) => {
        if (e.transform.k === 1 && e.transform.x === 0 && e.transform.y === 0) {
          return;
        }
        applyZoomPan(e);
        previous.x = 0;
        previous.y = 0;
        previous.k = 1;
      });
    /* eslint-enable no-underscore-dangle */

    const sel = d3.select(svgElem!);
    // Apply the zoom behavior to the SVG element
    zoom.apply(null, [sel]);
    // Remove the default double-click zoom behavior
    sel.on('dblclick.zoom', null);
  };

  let resetTimeout: NodeJS.Timeout | number | undefined;

  onMount(() => {
    makeMapZoomable();
    makeMapResizable(refMapShadow!);
    draw(
      canvasElem!,
      [0, 0],
      1,
      mapStore.mapDimensions.width,
      mapStore.mapDimensions.height,
    );
  });

  createEffect(
    on(
      () => layersDescriptionStore.layers
        .map((layer) => [
          layer.visible,
          layer.fillColor,
          layer.strokeColor,
          layer.fillOpacity,
          layer.strokeWidth,
          layer.strokeOpacity,
          layer.symbolSize,
          layer.strokeDasharray,
        ]),
      () => {
        console.log('layersDescriptionStore.layers changed');
        if (!svgElem) return;
        /* eslint-disable no-underscore-dangle */
        const translate = [svgElem!.__zoom.x, svgElem!.__zoom.y];
        const scale = svgElem!.__zoom.k;
        draw(
          canvasElem!,
          translate,
          scale,
          mapStore.mapDimensions.width,
          mapStore.mapDimensions.height,
        );
        /* eslint-enable no-underscore-dangle */
      },
    ),
  );

  return <div class="map-zone">
    <div
      class="map-zone__shadow"
      ref={refMapShadow!}
      style={{
        top: `${(globalStore.windowDimensions.height - mapStore.mapDimensions.height - globalStore.headerHeight) / 2 - 3}px`,
        left: `${(globalStore.windowDimensions.width - mapStore.mapDimensions.width - globalStore.leftMenuWidth) / 2 - 2}px`,
        height: `${mapStore.mapDimensions.height + 4}px`,
        width: `${mapStore.mapDimensions.width + 5}px`,
      }}
    >
      <div class='resizer top-left'></div>
      <div class='resizer top-right'></div>
      <div class='resizer bottom-left'></div>
      <div class='resizer bottom-right'></div>
    </div>
    <div
      class="map-zone__inner"
      style={{
        width: `${mapStore.mapDimensions.width + 4}px`,
        height: `${mapStore.mapDimensions.height + 4}px`,
      }}
    >
      <canvas
        class="map-zone__map"
        width={mapStore.mapDimensions.width}
        height={mapStore.mapDimensions.height}
        ref={canvasElem!}
        style={{
          'background-color': makeHexColorWithAlpha(mapStore.backgroundColor, mapStore.backgroundColorOpacity),
        }}
      />
      <svg
        ref={svgElem!}
        width={mapStore.mapDimensions.width}
        height={mapStore.mapDimensions.height}
        viewBox={`0 0 ${mapStore.mapDimensions.width} ${mapStore.mapDimensions.height}`}
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
            {(layer) => <Show when={layer.visible && !!layer.dropShadow}>
              <filter id={`filter-drop-shadow-${layer.id}`} width="200%" height="200%">
                <feDropShadow
                  dx={layer.dropShadow!.dx}
                  dy={layer.dropShadow!.dy}
                  stdDeviation={layer.dropShadow!.stdDeviation}
                  flood-color={layer.dropShadow!.color}
                  flood-opacity={1}
                />
              </filter>
            </Show>}
          </For>
        </defs>
        {/* Mask representing the margins selected by the user */}
        <Show when={
          mapStore.mapMargins.bottom > 0
          || mapStore.mapMargins.right > 0
          || mapStore.mapMargins.left > 0
          || mapStore.mapMargins.top > 0
        }>
          <g class="margins-mask">
            <path
              fill-rule="evenodd"
              stroke="none"
              fill={mapStore.mapMargins.color}
              opacity={mapStore.mapMargins.opacity}
              d={`M0,0 L${mapStore.mapDimensions.width},0 L${mapStore.mapDimensions.width},${mapStore.mapMargins.top} L0,${mapStore.mapMargins.top}
                    Z M0,${mapStore.mapDimensions.height} L${mapStore.mapDimensions.width},${mapStore.mapDimensions.height} L${mapStore.mapDimensions.width},${mapStore.mapDimensions.height - mapStore.mapMargins.bottom} L0,${mapStore.mapDimensions.height - mapStore.mapMargins.bottom}
                    Z M0,${mapStore.mapMargins.top} L${mapStore.mapMargins.left},${mapStore.mapMargins.top} L${mapStore.mapMargins.left},${mapStore.mapDimensions.height - mapStore.mapMargins.bottom} L0,${mapStore.mapDimensions.height - mapStore.mapMargins.bottom}
                    Z M${mapStore.mapDimensions.width - mapStore.mapMargins.right},${mapStore.mapMargins.top} L${mapStore.mapDimensions.width},${mapStore.mapMargins.top} L${mapStore.mapDimensions.width},${mapStore.mapDimensions.height - mapStore.mapMargins.bottom} L${mapStore.mapDimensions.width - mapStore.mapMargins.right},${mapStore.mapDimensions.height - mapStore.mapMargins.bottom}
                    Z`}
            />
          </g>
        </Show>
        {/* Layout features and legends, on top of the margins mask */}
        <For each={layersDescriptionStore.layoutFeaturesAndLegends}>
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
              }>{dispatchLegendRenderer(elem as Legend)}</Show>;
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
              <p>{LL().MapZone.DropFilesHere()}</p>
            </div>
          </foreignObject>
        </Show>
        <Show when={globalStore.displaySnappingGrid}>
          <g class="grid" pointer-events="none">
            <defs>
              <pattern
                id="grid-pattern"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 10 0 L 0 0 0 10"
                  fill="none"
                  stroke={applicationSettingsStore.snappingGridColor}
                  stroke-width="0.5"
                />
              </pattern>
            </defs>
            <rect
              x="0"
              y="0"
              width={mapStore.mapDimensions.width}
              height={mapStore.mapDimensions.height}
              fill="url(#grid-pattern)"
            />
          </g>
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
          disabled={mapStore.lockZoomPan}
        >
          <FiPlusSquare size={'1.5em'}/>
        </button>
      </p>
      <p class="control">
        <button
          class="button"
          onClick={handleClickZoomOut}
          aria-label={LL().MapZone.Controls.Minus()}
          title={LL().MapZone.Controls.Minus()}
          disabled={mapStore.lockZoomPan}
        >
          <FiMinusSquare size={'1.5em'}/>
        </button>
      </p>
      <p class="control">
        <Switch>
          <Match when={!mapStore.lockZoomPan}>
            <button
              class="button"
              onClick={() => {
                setMapStoreBase({ lockZoomPan: true });
              }}
              aria-label={LL().MapZone.Controls.Lock()}
              title={LL().MapZone.Controls.Lock()}
            >
              <FiUnlock size={'1.5em'}/>
            </button>
          </Match>
          <Match when={mapStore.lockZoomPan}>
            <button
              class="button"
              onClick={() => { setMapStoreBase({ lockZoomPan: false }); }}
              aria-label={LL().MapZone.Controls.Unlock()}
              title={LL().MapZone.Controls.Unlock()}
            >
              <FiLock size={'1.5em'} />
            </button>
          </Match>
        </Switch>
      </p>
    </div>
  </div>;
}
