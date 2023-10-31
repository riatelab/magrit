// Imports from solid-js
import { createEffect, on } from 'solid-js';
import { createStore } from 'solid-js/store';

// Helpers
import { unproxify } from '../helpers/common';
import d3 from '../helpers/d3-custom';
import { getD3ProjectionFromProj4, getProjection } from '../helpers/projection';
import { getTargetSvg, redrawPaths } from '../helpers/svg';

// Stores
import { debouncedPushUndoStack, resetRedoStackStore } from './stateStackStore';
import { globalStore, setGlobalStore } from './GlobalStore';
import { applicationSettingsStore } from './ApplicationSettingsStore';

// Types
import type { IZoomable, ProjectionDefinition } from '../global';

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

// We want to redraw path automatically when the mapStore is updated
// So we listen here to the mapStore scale, translate and rotate properties
// and update the projection accordingly, then redraw the paths
createEffect(() => {
  console.log('MapStore.ts: createEffect: mapStore.scale, mapStore.translate, mapStore.rotate');
  if (
    !globalStore.projection
  ) {
    return;
  }
  // Update projection
  globalStore.projection
    .scale(mapStore.scale)
    .translate(mapStore.translate)
    .rotate(mapStore.rotate);

  const targetSvg = document.querySelector('svg.map-zone__map');
  if (!targetSvg) {
    return;
  }

  redrawPaths(targetSvg as SVGSVGElement & IZoomable);
});

// We want to update the projection and pathGenerator when the mapStore is updated
// So we listen here to the mapStore projection property and update the projection accordingly
createEffect(
  on(
    () => mapStore.projection.value,
    () => {
      console.log('MapStore.ts: createEffect: mapStore.projection.value');
      // 1. Instantiate the projection (whether it is a d3 or proj4 projection)
      let projection;
      if (mapStore.projection.type === 'd3') {
        projection = d3[mapStore.projection.value]()
          .center(mapStore.center)
          .translate(mapStore.translate)
          .scale(mapStore.scale)
          .clipExtent(getDefaultClipExtent());
      } else { // mapStore.projection.type === 'proj4'
        projection = getD3ProjectionFromProj4(getProjection(mapStore.projection.value));
        projection.clipExtent(getDefaultClipExtent());
        if (mapStore.projection.bounds && JSON.stringify(mapStore.projection.bounds) !== '[90,-180,-90,180]') {
          // Apply a clipping polygon to the projection
          // if the bounds are not worldwide (i.e. [90,-180,-90,180])
          const [ymax, xmin, ymin, xmax] = mapStore.projection.bounds!;
          const clippingPolygon = {
            type: 'Polygon',
            coordinates: [[
              [xmin, ymax], [xmax, ymax], [xmax, ymin], [xmin, ymin], [xmin, ymax],
            ]],
          };
          projection.preclip(d3.geoClipPolygon(clippingPolygon));
          // Also zoom on the clipping polygon
          // Margin so that the extent of the layer is not on the border of the map
          const marginX = mapStore.mapDimensions.width * 0.03;
          const marginY = mapStore.mapDimensions.height * 0.03;

          // Fit the extent of the projection to the extent of the layer, with margins
          projection.fitExtent(
            [
              [marginX, marginY],
              [mapStore.mapDimensions.width - marginX, mapStore.mapDimensions.height - marginY],
            ],
            {
              type: 'FeatureCollection',
              features: [
                { type: 'Feature', geometry: clippingPolygon },
              ],
            } as any,
          );
        }
      }

      // 2. Instantiate the corresponding path generator
      const pathGenerator = d3.geoPath(projection);

      // 3. Update the global store with the new projection and pathGenerator
      setGlobalStore({
        projection,
        pathGenerator,
      });

      // Update the global store with the new scale and translate if they changed
      setMapStore({
        scale: projection.scale(),
        translate: projection.translate(),
      });
    },
  ),
);

export {
  mapStore,
  setMapStoreBase,
  setMapStore,
  getDefaultClipExtent,
};
