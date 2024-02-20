// Imports from solid-js
import { createEffect, on } from 'solid-js';
import { createStore, produce } from 'solid-js/store';

// Helpers
import { unproxify } from '../helpers/common';
import d3 from '../helpers/d3-custom';
import { makeDorlingDemersSimulation } from '../helpers/geo';
import { getD3ProjectionFromProj4, getProjection } from '../helpers/projection';
import { getTargetSvg, redrawPaths } from '../helpers/svg';

// Stores
import { debouncedPushUndoStack, resetRedoStackStore } from './stateStackStore';
import { globalStore, setGlobalStore } from './GlobalStore';
import {
  layersDescriptionStore,
  LayersDescriptionStoreType,
  setLayersDescriptionStore,
} from './LayersDescriptionStore';
import { applicationSettingsStore } from './ApplicationSettingsStore';

// Types
import type {
  GeoJSONFeature,
  IZoomable, LayerDescription, ProjectionDefinition, ProportionalSymbolsParameters,
} from '../global';

export type MapStoreType = {
  projection: ProjectionDefinition,
  translate: number[],
  scale: number,
  center: number[],
  rotate: number[],
  mapDimensions: { width: number, height: number },
  backgroundColor: string,
  backgroundColorOpacity: number,
  lockZoomPan: boolean,
};

const [
  mapStore,
  setMapStoreBase,
] = createStore({
  projection: {
    type: 'd3',
    value: 'geoNaturalEarth2',
    name: 'NaturalEarth2',
  },
  translate: [0, 0],
  scale: 1,
  center: [0, 0],
  rotate: [0, 0, 0],
  mapDimensions: { width: 0, height: 0 },
  backgroundColor: '#ffffff',
  backgroundColorOpacity: 1,
  lockZoomPan: false,
} as MapStoreType);

const getDefaultClipExtent = () => (
  applicationSettingsStore.useClipExtent
    ? [
      [-100, -100],
      [mapStore.mapDimensions.width + 100, mapStore.mapDimensions.height + 100],
    ] : null
);

/**
 * Get the extent, in geographic coordinates, covered by the current map view.
 *
 */
export const getCurrentExtent = (targetSvg: SVGSVGElement): number[][] => {
  const topLeft = globalStore.projection.invert([5, 5]);
  const bottomRight = globalStore.projection.invert(
    [mapStore.mapDimensions.width - 5, mapStore.mapDimensions.height - 5],
  );
  return [topLeft, bottomRight];
};

/**
 * This is a wrapper around the setMapStoreBase function.
 * The wrapper is used to push the current state to the undo stack
 * before actually updating the store.
 */
const setMapStore = (...args: any[]) => {
  // Push the current state to the undo stack
  debouncedPushUndoStack('mapStore', unproxify(mapStore as never));
  // Reset the redo stack
  resetRedoStackStore();
  // Update the store
  setMapStoreBase.apply(null, args as never); // eslint-disable-line prefer-spread
};

/**
 * Fit the extent of the projection to the extent of the layer, with margins.
 *
 * @param {string} id
 * @param {number} [margin=0.03] - The margin to apply to the extent of the layer.
 */
const fitExtent = (id: string, margin = 0.03) => {
  // Get a reference to the SVG element
  const svgElem = getTargetSvg();

  // Margin so that the extent of the layer is not on the border of the map
  const marginX = mapStore.mapDimensions.width * margin;
  const marginY = mapStore.mapDimensions.height * margin;

  // Fit the extent of the projection to the extent of the layer, with margins
  globalStore.projection.fitExtent(
    [
      [marginX, marginY],
      [mapStore.mapDimensions.width - marginX, mapStore.mapDimensions.height - marginY],
    ],
    layersDescriptionStore.layers.find((l) => l.id === id)?.data,
  );

  // Update the global store with the new scale and translate
  setMapStore({
    scale: globalStore.projection.scale(),
    translate: globalStore.projection.translate(),
  });

  // Redraw the paths
  redrawPaths(svgElem);
};

// We want to redraw path automatically when the mapStore is updated
// So we listen here to the mapStore scale, translate and rotate properties
// and update the projection accordingly, then redraw the paths
createEffect(
  on(
    () => [mapStore.scale, mapStore.translate, mapStore.rotate],
    () => {
      if (
        !globalStore.projection
      ) {
        console.log('MapStore.ts: createEffect: mapStore.scale, mapStore.translate, mapStore.rotate: !globalStore.projection');
        return;
      }
      const targetSvg = document.querySelector('svg.map-zone__map');
      if (!targetSvg) {
        console.log('MapStore.ts: createEffect: mapStore.scale, mapStore.translate, mapStore.rotate: !targetSvg');
        return;
      }
      // Update projection
      globalStore.projection
        .scale(mapStore.scale)
        .translate(mapStore.translate);

      if (globalStore.projection.rotate) {
        globalStore.projection.rotate(mapStore.rotate);
      }

      // Recompute position for proportional symbols layers with the avoidOverlapping option
      setLayersDescriptionStore(
        produce(
          (draft: LayersDescriptionStoreType) => {
            draft.layers
              .filter((l) => l.rendererParameters && l.rendererParameters.avoidOverlapping === true)
              .forEach((l) => {
                const layerDescription = (
                  l as LayerDescription & { rendererParameters: ProportionalSymbolsParameters });
                if (layerDescription.rendererParameters.avoidOverlapping) {
                  layerDescription.data.features = makeDorlingDemersSimulation(
                    unproxify(layerDescription.data.features as never) as GeoJSONFeature[],
                    layerDescription.rendererParameters.variable,
                    {
                      referenceSize: layerDescription.rendererParameters.referenceRadius,
                      referenceValue: layerDescription.rendererParameters.referenceValue,
                      symbolType: layerDescription.rendererParameters.symbolType,
                    },
                    layerDescription.rendererParameters.iterations,
                    layerDescription.strokeWidth as number,
                  );
                }
              });
          },
        ),
      );
      console.time('redrawPaths');
      redrawPaths(targetSvg as SVGSVGElement & IZoomable);
      console.timeEnd('redrawPaths');
    },
  ),
);

// We want to update the projection clipExtent when the mapStore mapDimensions property is updated
// (which can be when the user resizes the window or when the user changes the map dimensions)
createEffect(
  on(
    () => [mapStore.mapDimensions.width, mapStore.mapDimensions.height],
    () => {
      if (!globalStore.projection) {
        console.log('MapStore.ts: createEffect: mapStore.mapDimensions.width, mapStore.mapDimensions.height: !globalStore.projection');
        return;
      }
      setGlobalStore(
        produce((draft) => {
          draft.projection.clipExtent(getDefaultClipExtent());
        }),
      );
      redrawPaths(getTargetSvg());
    },
  ),
);

const isConicalProjection = (proj4StringOrWkt: string) => {
  if (
    proj4StringOrWkt.includes('proj=aea')
    || proj4StringOrWkt.includes('Albers_Conic_Equal_Area')
    || proj4StringOrWkt.includes('Equal_Area_Conic')
  ) {
    return true;
  }
  if (
    proj4StringOrWkt.includes('proj=lcc')
    || proj4StringOrWkt.includes('proj=leac')
    || proj4StringOrWkt.includes('Lambert_Conformal_Conic')) {
    return true;
  }
  if (
    proj4StringOrWkt.includes('proj=eqdc')
    || proj4StringOrWkt.includes('Equidistant_Conic')
  ) {
    return true;
  }
  return false;
};

// We want to update the projection and pathGenerator when the mapStore is updated
// So we listen here to the mapStore projection property and update the projection accordingly
createEffect(
  on(
    () => mapStore.projection.value,
    () => {
      console.log('MapStore.ts: createEffect: mapStore.projection.value');
      // 0. We don't need to execute what follows if the map is not yet initialized
      const targetSvg = document.querySelector('svg.map-zone__map');
      if (!targetSvg) {
        return;
      }

      // 1. Instantiate the projection (whether it is a d3 or proj4 projection)
      let projection;
      if (mapStore.projection.type === 'd3') {
        projection = d3[mapStore.projection.value]()
          .translate(mapStore.translate)
          .scale(mapStore.scale);

        if (projection.center) {
          projection.center(mapStore.center);
        }
      } else { // mapStore.projection.type === 'proj4'
        console.log(mapStore.projection.value);
        projection = getD3ProjectionFromProj4(getProjection(mapStore.projection.value));
        projection.center(mapStore.center)
          .translate(mapStore.translate)
          .scale(mapStore.scale);
        // 2. If the projection defines bounds, we want to apply a clipping polygon
        // to the projection to avoid the projection to be drawn outside of the bounds
        // (which is sometimes computationally very expensive)
        if (
          mapStore.projection.bounds
          && JSON.stringify(mapStore.projection.bounds) !== '[90,-180,-90,180]'
          // && isConicalProjection(mapStore.projection.value)
        ) {
          // We want to apply a clipping polygon to the projection
          // if the bounds are not worldwide (i.e. [90,-180,-90,180]).
          // First we will expand the bounds by 15 degree in each direction
          const [ymax0, xmin0, ymin0, xmax0] = mapStore.projection.bounds!;

          const ymax = ymax0 + 15 > 90 ? 90 : ymax0 + 15;
          const xmin = xmin0 - 15 < -180 ? -180 : xmin0 - 15;
          const ymin = ymin0 - 15 < -90 ? -90 : ymin0 - 15;
          const xmax = xmax0 + 15 > 180 ? 180 : xmax0 + 15;

          const clippingPolygon = {
            type: 'Polygon',
            coordinates: [[
              [xmin, ymax], [xmax, ymax], [xmax, ymin], [xmin, ymin], [xmin, ymax],
            ]],
          };

          projection.preclip(d3.geoClipPolygon(clippingPolygon));
        }
        // else {
        //   const [ymax, xmin, ymin, xmax] = [90, -180, -90, 180];
        //   const clippingPolygon = {
        //     type: 'Polygon',
        //     coordinates: [[
        //       [xmin, ymax], [xmax, ymax], [xmax, ymin], [xmin, ymin], [xmin, ymax],
        //     ]],
        //   };
        //
        //   projection.preclip(d3.geoClipPolygon(clippingPolygon));
        // }
      }

      projection.clipExtent(getDefaultClipExtent());

      // 3. Fit the map to the previous extent (because the projection just changed
      //    and we want to keep the same extent if possible), except if we are reloading the project
      //    (in which case we don't want to fit the map to the previous extent but to the extent
      //    of the map as it was when the project was saved)
      if (!globalStore.isReloadingProject) {
        const currentExtent = getCurrentExtent(targetSvg as SVGSVGElement & IZoomable);
        if (currentExtent && currentExtent[0] && currentExtent[1]) {
          projection.fitExtent(
            [
              [5, 5],
              [mapStore.mapDimensions.width - 5, mapStore.mapDimensions.height - 5],
            ],
            {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'Polygon',
                    coordinates: [[
                      [currentExtent[0][0], currentExtent[0][1]],
                      [currentExtent[1][0], currentExtent[0][1]],
                      [currentExtent[1][0], currentExtent[1][1]],
                      [currentExtent[0][0], currentExtent[1][1]],
                      [currentExtent[0][0], currentExtent[0][1]],
                    ]],
                  },
                },
              ],
            },
          );
        }
      }

      // 4. Instantiate the corresponding path generator
      const pathGenerator = d3.geoPath(projection);

      // 5. Update the global store with the new projection and pathGenerator
      setGlobalStore({
        projection,
        pathGenerator,
      });

      // 6. Update the global store with the new scale and translate if they changed
      setMapStore({
        scale: projection.scale(),
        translate: projection.translate(),
      });
    },
  ),
);

export {
  fitExtent,
  getDefaultClipExtent,
  mapStore,
  setMapStoreBase,
  setMapStore,
};
