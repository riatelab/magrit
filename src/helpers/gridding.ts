// Imports from third-party libraries
import { type AllGeoJSON, area, bbox } from '@turf/turf';
import RBush from 'rbush';

// GeoJSON types
import { FeatureCollection, Feature, Geometry } from 'geojson';

// Helpers
import d3 from './d3-custom';
import { isFiniteNumber } from './common';
import { planarArea } from './geo';
import { intersectionFeature, intersectionLayer } from './geos';
import { transformResolution, gridFunctions } from './grid-creation';
import {
  getProjection,
  getProjectionUnit,
  reprojWithD3,
  reprojWithProj4,
} from './projection';

// Stores
import { mapStore } from '../store/MapStore';

// Types / Interfaces / Enum
import type { GriddedLayerParameters } from '../global.d';

// const transformResolution = (
//   resolution: number,
//   cellType: GridCellShape,
//   isGeo: boolean,
// ): number => {
//   if (isGeo) {
//     // The distance was given in km but we want it in degrees
//     const newResolution = resolution / 110;
//     if (cellType === 'hexagon') return newResolution / SQRT3;
//     // For all other types of cells, we can keep the resolution as is
//     return newResolution;
//   }
//   // The distance was given in km but we want it in meters
//   const newResolution = resolution * 1000;
//   if (cellType === 'hexagon') return newResolution / SQRT3;
//   // For all other types of cells, we can keep the resolution as is
//   return newResolution;
// };

const getBbox = (feature: Feature, ix: number | undefined) => {
  // Note that we use the "recompute" options because there may already be a bounding
  // box stored at the feature level, but its in WGS84 and here we want
  // the bounding box in the current projection of the data.
  const t = bbox(feature as AllGeoJSON, { recompute: true });
  return {
    minX: t[0],
    minY: t[1],
    maxX: t[2],
    maxY: t[3],
    ix,
  };
};

export const computeGriddedLayer = async (
  data: FeatureCollection,
  params: GriddedLayerParameters,
): Promise<FeatureCollection> => {
  // We want to determine if the current map projection is a "geographic" projection (i.e. lat/lon)
  // or a "projected" projection (with meters or feet as units).
  let reprojFunc;
  let proj;
  let isGeo;
  if (mapStore.projection.type === 'd3') {
    isGeo = true;
    proj = (d3[mapStore.projection.value] as never)()
      .center([0, 0])
      .translate([0, 0])
      .scale(1);
    reprojFunc = reprojWithD3;
  } else { // mapStore.projection.type === 'proj4'
    const t = getProjectionUnit(mapStore.projection);
    isGeo = t.isGeo;
    proj = getProjection(mapStore.projection.value);
    reprojFunc = reprojWithProj4;
  }

  const resolution = transformResolution(
    params.gridParameters.resolution,
    params.cellType,
    // isGeo,
  );
  console.log('computeGriddedLayer: isGeo', isGeo, '; resolution', resolution, isGeo ? 'degrees' : 'meters');
  // If data is geo we keep it in WGS84, otherwise we reproject it to the current map projection
  const projectedData = isGeo ? data : reprojFunc(proj, data);

  // We want to compute the bounding box of the data (in the current map projection if it's not geo)
  // Note that we use the "recompute" options because there may already be a bounding
  // box stored at the feature collection level, but its in WGS84 and here we want
  // the bounding box in the current projection of the data.
  const extent = bbox(
    projectedData as AllGeoJSON,
    { recompute: true },
  ) as [number, number, number, number];

  // Generate the grid with the appropriate shape
  const grid = gridFunctions[params.cellType](extent, resolution);

  // Clip the grid with the data (this will remove the cells that are outside of the data)
  const clippedGrid = await intersectionLayer(grid, projectedData);
  // When some cells are clipped, we may occasionally have some cells that are not polygons
  // (but points, because the topological dimension of the resulting intersection is 0
  // so we only have contact between the grid and the input layer on point(s)).
  clippedGrid.features = clippedGrid.features.filter((d) => (
    d.geometry?.type === 'Polygon' || d.geometry?.type === 'MultiPolygon'));

  // Area function
  const areaFn = isGeo ? area : planarArea;

  // Index all the input features in an R-tree
  const tree = new RBush();
  tree.load(
    projectedData.features.map((d: Feature, i: number) => getBbox(d, i)),
  );

  // Loop over the cells of the clipped grid...
  for (let ixCell = 0; ixCell < clippedGrid.features.length; ixCell += 1) {
    const cellFeature = clippedGrid.features[ixCell] as Feature<Geometry, Record<string, unknown>>;
    // We want to find all the features that may intersect the current cell
    const boxFeature = getBbox(cellFeature, undefined);
    const ftsTree = tree.search(boxFeature);
    // TODO: document a bit more what we are doing here for maintainability...
    const areasPart = [];
    const values = [];

    for (let j = 0; j < ftsTree.length; j += 1) {
      const ftTree = ftsTree[j];
      const ix = ftTree.ix as number;
      const poly = projectedData.features[ix];
      // eslint-disable-next-line no-await-in-loop
      const intersection = await intersectionFeature(poly, cellFeature);
      if (intersection) {
        // We store the share (intersected area / feature area)
        // and the value of the feature
        const intersectionArea = areaFn(intersection);
        const featureArea = areaFn(poly);
        areasPart.push(intersectionArea / featureArea);
        // TODO: the current behavior for missing values is to set them to 0,
        //       but we may want to change this in the future
        values.push(
          isFiniteNumber(intersection.properties[params.variable])
            ? +(intersection.properties[params.variable] as any)
            : 0,
        );
      }
    }
    let sum = 0;
    for (let j = 0; j < areasPart.length; j += 1) {
      sum += areasPart[j] * values[j];
    }
    cellFeature.properties[`density-${params.variable}`] = (sum / areaFn(cellFeature)) * 1000000;
    cellFeature.properties.sum = sum;
    cellFeature.properties.id = ixCell;
  }

  // const resultGrid = isGeo
  //   ? rewindLayer(clippedGrid, false)
  //   : rewindLayer(reprojFunc(proj, clippedGrid, true), false);

  return isGeo
    ? clippedGrid
    : reprojFunc(proj, clippedGrid, true);
};

export const noop = () => {};
