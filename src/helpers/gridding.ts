// Imports from third-party libraries
import { type AllGeoJSON, area, bbox } from '@turf/turf';
import RBush from 'rbush';

// Helpers
import d3 from './d3-custom';
import { planarArea } from './geo';
import { intersectionFeature, intersectionLayer } from './geos';
import {
  degToRadConstant,
  Mceil,
  Mcos,
  Mfloor,
  Msin,
  SQRT3,
} from './math';
import { getD3ProjectionFromProj4, getProjection, reprojWithD3 } from './projection';
import rewindLayer from './rewind';

// Stores
import { mapStore } from '../store/MapStore';

// Types / Interfaces / Enum
import {
  GeoJSONFeature,
  GeoJSONFeatureCollection,
  GridCellShape,
  GriddedLayerParameters,
  GridParameters,
} from '../global.d';

const transformResolution = (
  resolution: number,
  cellType: GridCellShape,
  isGeo: boolean,
): number => {
  if (isGeo) {
    // The distance was given in km but we want it in degrees
    const newResolution = resolution / 110;
    if (cellType === 'hexagon') return newResolution / SQRT3;
    // For all other types of cells, we can keep the resolution as is
    return newResolution;
  }
  // The distance was given in km but we want it in meters
  const newResolution = resolution * 1000;
  if (cellType === 'hexagon') return newResolution / SQRT3;
  // For all other types of cells, we can keep the resolution as is
  return newResolution;
};

const generateSquareGrid = (
  extent: [number, number, number, number],
  cellSize: number,
): GeoJSONFeatureCollection => {
  const [xmin, ymin, xmax, ymax] = extent;
  const grid: GeoJSONFeatureCollection = {
    type: 'FeatureCollection',
    features: [],
  };
  const rows = Mceil((ymax - ymin) / cellSize);
  const cols = Mceil((xmax - xmin) / cellSize);

  let xLeftOrigin = xmin;
  let xRightOrigin = xmin + cellSize;
  const yTopOrigin = ymax;
  const yBottomOrigin = ymax - cellSize;

  for (let countCols = 0; countCols < cols; countCols += 1) {
    let yTop = yTopOrigin;
    let yBottom = yBottomOrigin;
    for (let countRows = 0; countRows < rows; countRows += 1) {
      grid.features.push({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          bbox: [xLeftOrigin, yBottom, xRightOrigin, yTop],
          coordinates: [
            [
              [xLeftOrigin, yTop],
              [xLeftOrigin, yBottom],
              [xRightOrigin, yBottom],
              [xRightOrigin, yTop],
              [xLeftOrigin, yTop],
            ],
          ],
        },
        properties: {
          id: `${countRows}-${countCols}`,
        },
      });
      yTop -= cellSize;
      yBottom -= cellSize;
    }
    xLeftOrigin += cellSize;
    xRightOrigin += cellSize;
  }

  return grid;
};

const generateDiamondGrid = (
  extent: [number, number, number, number],
  cellSize: number,
): GeoJSONFeatureCollection => {
  const [xmin, ymin, xmax, ymax] = extent;
  const grid: GeoJSONFeatureCollection = {
    type: 'FeatureCollection',
    features: [],
  };
  const height = cellSize * 1.45;
  const halfHeight = height / 2;
  const rows = Mceil((ymax - ymin) / cellSize) + 1;
  const cols = Mceil((xmax - xmin) / cellSize) + 2;

  const xLeftOrigin = xmin - height;
  const yBottomOrigin = ymin - halfHeight;

  for (let col = 0; col < (cols * 2) - 1; col += 1) {
    const t = col % 2;
    const x1 = xLeftOrigin + (col * halfHeight);
    const x2 = xLeftOrigin + ((col + 1) * halfHeight);
    const x3 = xLeftOrigin + ((col + 2) * halfHeight);
    for (let row = 0; row < rows; row += 1) {
      const y1 = yBottomOrigin + (((row * 2) + t) * halfHeight);
      const y2 = yBottomOrigin + (((row * 2) + 1 + t) * halfHeight);
      const y3 = yBottomOrigin + (((row * 2) + 2 + t) * halfHeight);

      grid.features.push({
        type: 'Feature',
        bbox: [x1, y1, x3, y3],
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [x1, y2],
              [x2, y3],
              [x3, y2],
              [x2, y1],
              [x1, y2],
            ],
          ],
        },
        properties: {
          id: `${row}-${col}`,
        },
      });
    }
  }
  return grid;
};

const generateHexGrid = (
  extent: [number, number, number, number],
  cellSize: number,
): GeoJSONFeatureCollection => {
  const [xmin, ymin, xmax, ymax] = extent;
  const hexWidth = SQRT3 * cellSize;
  const hexHeight = 2 * cellSize;
  const verticalSpacing = hexHeight * (3 / 4);
  const horizontalSpacing = hexWidth;

  const grid: GeoJSONFeatureCollection = {
    type: 'FeatureCollection',
    features: [],
  };

  const calculateHexVertices = (centerX: number, centerY: number) => {
    const vertices: [number, number][] = [];
    for (let i = 0; i < 6; i += 1) {
      // -30 to start at top right angle
      const angleRad = degToRadConstant * (60 * i - 30);
      vertices.push([
        centerX + cellSize * Mcos(angleRad),
        centerY + cellSize * Msin(angleRad),
      ]);
    }
    vertices.push(vertices[0]);
    return vertices;
  };

  for (let y = ymin; y + cellSize * 2 <= ymax; y += verticalSpacing) {
    const isOddRow = Mfloor((y - ymin) / verticalSpacing) % 2 === 1;
    for (
      let x = xmin + (isOddRow ? hexWidth / 2 : 0);
      x + cellSize * SQRT3 <= xmax;
      x += horizontalSpacing
    ) {
      const vertices = calculateHexVertices(x, y);
      grid.features.push({
        type: 'Feature',
        bbox: [x - hexWidth, y - hexHeight, x + hexWidth, y + hexHeight],
        geometry: {
          type: 'Polygon',
          coordinates: [vertices],
        },
        properties: {
          centerX: x,
          centerY: y,
        },
      });
    }
  }

  return grid;
};

const generateTriangularGrid = (
  extent: [number, number, number, number],
  cellSize: number,
): GeoJSONFeatureCollection => {
  const [xmin, ymin, xmax, ymax] = extent;
  const grid: GeoJSONFeatureCollection = {
    type: 'FeatureCollection',
    features: [],
  };
  const rows = Mceil((ymax - ymin) / cellSize);
  const cols = Mceil((xmax - xmin) / cellSize);

  let xLeftOrigin = xmin;
  let xRightOrigin = xmin + cellSize;
  const yTopOrigin = ymax;
  const yBottomOrigin = ymax - cellSize;

  for (let countCols = 0; countCols < cols; countCols += 1) {
    let yTop = yTopOrigin;
    let yBottom = yBottomOrigin;
    for (let countRows = 0; countRows < rows; countRows += 1) {
      grid.features.push({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          bbox: [xLeftOrigin, yBottom, xRightOrigin, yTop],
          coordinates: [
            [
              [xLeftOrigin, yTop],
              [xLeftOrigin, yBottom],
              [xRightOrigin, yTop],
              [xLeftOrigin, yTop],
            ],
          ],
        },
        properties: {
          id: `${countRows}-${countCols}`,
        },
      });
      grid.features.push({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          bbox: [xLeftOrigin, yBottom, xRightOrigin, yTop],
          coordinates: [
            [
              [xRightOrigin, yTop],
              [xLeftOrigin, yBottom],
              [xRightOrigin, yBottom],
              [xRightOrigin, yTop],
            ],
          ],
        },
        properties: {
          id: `${countRows}-${countCols}`,
        },
      });
      yTop -= cellSize;
      yBottom -= cellSize;
    }
    xLeftOrigin += cellSize;
    xRightOrigin += cellSize;
  }

  return grid;
};

const gridFunctions = {
  square: generateSquareGrid,
  hexagon: generateHexGrid,
  triangle: generateTriangularGrid,
  diamond: generateDiamondGrid,
};

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
  let proj;
  let isGeo;
  if (mapStore.projection.type === 'd3') {
    isGeo = true;
    proj = d3[mapStore.projection.value]()
      .center([0, 0])
      .translate([0, 0])
      .scale(1);
  } else { // mapStore.projection.type === 'proj4'
    isGeo = false;
    proj = getD3ProjectionFromProj4(getProjection(mapStore.projection.value))
      .translate([0, 0])
      .scale(1);
  }
  const resolution = transformResolution(
    params.gridParameters.resolution,
    params.cellType,
    isGeo,
  );
  console.log('computeGriddedLayer: isGeo', isGeo, '; resolution', resolution, isGeo ? 'degrees' : 'meters');
  // If data is geo we keep it in WGS84, otherwise we reproject it to the current map projection
  const projectedData = isGeo ? data : reprojWithD3(proj, data);

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
    : rewindLayer(reprojWithD3(proj, clippedGrid, true));

  return resultGrid;
};

export const noop = () => {};
