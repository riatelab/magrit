// Imports from solid-js
import { createEffect, on } from 'solid-js';
import { createStore, produce } from 'solid-js/store';

// Helpers
import { unproxify } from '../helpers/common';
import d3 from '../helpers/d3-custom';
import { makeDorlingDemersSimulation, makePolygonFromBbox } from '../helpers/geo';
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
  mapMargins: {
    color: string,
    opacity: number,
    top: number,
    right: number,
    bottom: number,
    left: number,
  },
  mapDimensions: { width: number, height: number },
  mapAnnotations: { title: string, source: string },
  backgroundColor: string,
  backgroundColorOpacity: number,
  lockZoomPan: boolean,
  parallel?: number,
  parallels?: number[],
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
  mapMargins: {
    color: '#bdbdbd',
    opacity: 0.8,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  mapAnnotations: { title: '', source: '' },
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
 * If for any reason the extent cannot be computed, the function will return
 * a default extent covering, roughly, the whole world.
 * We need to do this because, if some projection fails to compute the map coordinates,
 * and so the user wants to switch to another projection, we don't want this function
 * (which is called when a projection changes) to fail.
 *
 */
export const getCurrentExtent = (): number[][] => {
  try {
    const topLeft = globalStore.projection.invert([20, 20]);
    const bottomRight = globalStore.projection.invert(
      [mapStore.mapDimensions.width - 20, mapStore.mapDimensions.height - 20],
    );
    return [topLeft, bottomRight];
  } catch (e) {
    return [[-179.0, 85], [179.0, -85]];
  }
};

/**
 * This is a wrapper around the setMapStoreBase function.
 * The wrapper is used to push the current state to the undo stack
 * before actually updating the store.
 */
const setMapStore = (...args: any[]) => {
  // Push the current state to the undo stack
  debouncedPushUndoStack('mapStore', unproxify(mapStore));
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
  // (paths will be redrawn automatically because of the createEffect below)
  setMapStore({
    scale: globalStore.projection.scale(),
    translate: globalStore.projection.translate(),
  });
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

      if (globalStore.projection.parallel) {
        globalStore.projection.parallel(mapStore.parallel || 0);
      }

      if (globalStore.projection.parallels) {
        globalStore.projection.parallels(mapStore.parallels || [0, 0]);
      }

      // Do we need to recompute positions for proportional symbols layers
      // with avoidOverlapping option?
      // (we need to do this if at least one layer has the avoidOverlapping option set to true)
      // If we don't need to recompute positions, we can just redraw the paths, we avoid calling
      // setLayersDescriptionStore (which is computationally expensive because it moves
      // previous state to the undo redo stack)
      const needToRecomputePositions = layersDescriptionStore.layers
        .some((l) => l.rendererParameters && l.rendererParameters.avoidOverlapping === true);

      if (needToRecomputePositions) {
        setLayersDescriptionStore(
          produce(
            (draft: LayersDescriptionStoreType) => {
              // Recompute position for proportional symbols layers with the avoidOverlapping option
              draft.layers
                .filter((l) => (
                  l.rendererParameters && l.rendererParameters.avoidOverlapping === true))
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
      }
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
      if (!document.querySelector('svg.map-zone__map')) {
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
        if (projection.rotate) {
          projection.rotate(mapStore.rotate);
        }
      } else { // mapStore.projection.type === 'proj4'
        projection = getD3ProjectionFromProj4(getProjection(mapStore.projection.value));
        projection.center([0, 0])
          .translate(mapStore.translate)
          .scale(mapStore.scale)
          .rotate([0, 0, 0]);
        // 2. If the projection defines bounds, we want to apply a clipping polygon
        // to the projection to avoid the projection to be drawn outside of the bounds
        // (which is sometimes computationally very expensive or can cause errors)
        if (
          mapStore.projection.bounds
          && JSON.stringify(mapStore.projection.bounds) !== '[90,-180,-90,180]'
        ) {
          if (
            mapStore.projection.code === 'EPSG:3035'
            || mapStore.projection.value === '+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs'
          ) {
            // Special case for EPSG:3035 (ETRS89 / LAEA Europe)
            // where we substantially expand the bounds to avoid the drawn extent
            // to be too narrow (which the user might find surprising)
            // Original bounds are: 84.73, -35.58, 24.6, 44.83
            const ymax = 90;
            const xmin = -80;
            const ymin = 0;
            const xmax = 100;

            const clippingPolygon = makePolygonFromBbox([xmin, ymin, xmax, ymax]);

            projection.preclip(d3.geoClipPolygon(clippingPolygon));
          } else {
            // We want to apply a clipping polygon to the projection
            // if the bounds are not worldwide (i.e. [90,-180,-90,180]).
            const [ymax0, xmin0, ymin0, xmax0] = mapStore.projection.bounds!;

            // First we will expand the bounds in each direction
            const ymax = ymax0 + 25 > 90 ? 90 : ymax0 + 25;
            const xmin = xmin0 - 35 < -180 ? -180 : xmin0 - 35;
            const ymin = ymin0 - 25 < -90 ? -90 : ymin0 - 25;
            const xmax = xmax0 + 35 > 180 ? 180 : xmax0 + 35;

            const clippingPolygon = makePolygonFromBbox([xmin, ymin, xmax, ymax]);

            projection.preclip(d3.geoClipPolygon(clippingPolygon));
          }
        }
      }

      projection.clipExtent(getDefaultClipExtent());

      // 3. Fit the map to the previous extent (because the projection just changed
      //    and we want to keep the same extent if possible), except if we are reloading the project
      //    (in which case we don't want to fit the map to the previous extent but to the extent
      //    of the map as it was when the project was saved)
      if (!globalStore.isReloadingProject) {
        const currentExtent = getCurrentExtent();
        if (currentExtent && currentExtent[0] && currentExtent[1]) {
          projection.fitExtent(
            [
              [20, 20],
              [mapStore.mapDimensions.width - 20, mapStore.mapDimensions.height - 20],
            ],
            {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  properties: {},
                  // current extent is [[top left x, top left y], [bottom right x, bottom right y]]
                  geometry: makePolygonFromBbox([
                    currentExtent[0][0],
                    currentExtent[1][1],
                    currentExtent[1][0],
                    currentExtent[0][1],
                  ]),
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

      // 6. Update the global store with the new
      // scale, translate, rotate, center, parallel and parallels values
      // if they changed
      setMapStore({
        scale: projection.scale(),
        translate: projection.translate(),
        rotate: projection.rotate ? projection.rotate() : undefined,
        center: projection.center ? projection.center() : undefined,
        parallel: projection.parallel ? projection.parallel() : undefined,
        parallels: projection.parallels ? projection.parallels() : undefined,
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
