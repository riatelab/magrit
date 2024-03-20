// Imports from third-party libraries
import { type AllGeoJSON, area, bbox } from '@turf/turf';
import RBush from 'rbush';

// Helpers
import d3 from './d3-custom';
import { planarArea } from './geo';
import { intersectionFeature, intersectionLayer } from './geos';
import { transformResolution, gridFunctions } from './grid-creation';
import {
  getProjection,
  getProjectionUnit,
  reprojWithD3,
  reprojWithProj4,
} from './projection';
import rewindLayer from './rewind';

// Stores
import { mapStore } from '../store/MapStore';

// Types / Interfaces / Enum
import {
  GeoJSONFeature,
  GeoJSONFeatureCollection,
  GriddedLayerParameters,
} from '../global.d';

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

const getBbox = (feature: GeoJSONFeature, ix: number | undefined) => {
  // Did we store a bbox in the feature?
  if (feature.bbox) {
    return {
      minX: feature.bbox[0],
      minY: feature.bbox[1],
      maxX: feature.bbox[2],
      maxY: feature.bbox[3],
      ix,
    };
  }
  // If not we compute it
  const t = bbox(feature as AllGeoJSON);
  return {
    minX: t[0],
    minY: t[1],
    maxX: t[2],
    maxY: t[3],
    ix,
  };
};

export const computeGriddedLayer = async (
  data: GeoJSONFeatureCollection,
  params: GriddedLayerParameters,
): Promise<GeoJSONFeatureCollection> => {
  // We want to determine if the current map projection is a "geographic" projection (i.e. lat/lon)
  // or a "projected" projection (with meters or feet as units).
  let reprojFunc;
  let proj;
  let isGeo;
  if (mapStore.projection.type === 'd3') {
    isGeo = true;
    proj = d3[mapStore.projection.value]()
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
  const extent = bbox(projectedData as AllGeoJSON) as [number, number, number, number];

  // Generate the grid with the appropriate shape
  const grid = gridFunctions[params.cellType](extent, resolution);

  // Clip the grid with the data (this will remove the cells that are outside of the data)
  const clippedGrid = await intersectionLayer(grid, projectedData);

  // Area function
  const areaFn = isGeo ? area : planarArea;

  // Index all the input features in an R-tree
  const tree = new RBush();
  tree.load(
    projectedData.features.map((d, i) => getBbox(d, i)),
  );

  // Loop over the cells of the clipped grid...
  for (let ixCell = 0; ixCell < clippedGrid.features.length; ixCell += 1) {
    const cellFeature = clippedGrid.features[ixCell];
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
        const intersectionArea = areaFn(intersection as AllGeoJSON);
        const featureArea = areaFn(poly as AllGeoJSON);
        areasPart.push(intersectionArea / featureArea);
        values.push(+(intersection.properties[params.variable] as any));
      }
    }
    let sum = 0;
    for (let j = 0; j < areasPart.length; j += 1) {
      sum += areasPart[j] * values[j];
    }
    cellFeature.properties[`density-${params.variable}`] = (sum / areaFn(cellFeature as AllGeoJSON)) * 1000000;
    cellFeature.properties.sum = sum;
  }

  const resultGrid = isGeo
    ? rewindLayer(clippedGrid)
    : rewindLayer(reprojFunc(proj, clippedGrid, true));

  return resultGrid;
};

export const noop = () => {};
