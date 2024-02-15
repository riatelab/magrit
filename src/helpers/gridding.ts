// Imports from third-party libraries
import { bbox } from '@turf/turf';

// Helpers
import { Mceil, Msqrt } from './math';
import { reprojWithD3 } from './projection';

// Stores
import { globalStore } from '../store/GlobalStore';

// Types / Interfaces / Enum
import { GeoJSONFeatureCollection, GriddedLayerParameters, GridParameters } from '../global';

const generateSquareGrid = (
  extent: [number, number, number, number],
  cellSize: number,
  // parameters: GridParameters,
): GeoJSONFeatureCollection => {
  // const {
  //   xMin: xmin,
  //   xMax: xmax,
  //   yMin: ymin,
  //   yMax: ymax,
  //   resolution: cellSize,
  // } = parameters;
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

const generateHexGrid = (
  extent: [number, number, number, number],
  cellSize: number,
  // parameters: GridParameters,
): GeoJSONFeatureCollection => {
  // const {
  //   xMin: xmin,
  //   xMax: xmax,
  //   yMin: ymin,
  //   yMax: ymax,
  //   resolution: cellSize,
  // } = parameters;
  const [xmin, ymin, xmax, ymax] = extent;
  const grid: GeoJSONFeatureCollection = {
    type: 'FeatureCollection',
    features: [],
  };
  const rows = Mceil((ymax - ymin) / cellSize);
  const cols = Mceil((xmax - xmin) / cellSize);

  const halfHeight = cellSize / 2;
  const xvertexlo = 0.288675134594813 * halfHeight;
  const xvertexhi = 0.577350269189626 * halfHeight;
  const xSpacing = xvertexlo + xvertexhi;

  const xLeftOrigin = xmin - cellSize;
  const yBottomOrigin = ymin - cellSize;

  for (let col = 0; col < cols * 2; col += 1) {
    const x1 = xLeftOrigin + (col * xSpacing);
    const x2 = x1 + (xvertexhi - xvertexlo);
    const x3 = xLeftOrigin + ((col + 1) * xSpacing);
    const x4 = x3 + (xvertexhi - xvertexlo);
    const t = col % 2;
    for (let row = 0; row < rows + 1; row += 1) {
      const y1 = yBottomOrigin + (((row * 2) + t) * halfHeight);
      const y2 = yBottomOrigin + (((row * 2) + 1 + t) * halfHeight);
      const y3 = yBottomOrigin + (((row * 2) + 2 + t) * halfHeight);
      grid.features.push({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [x1, y2],
              [x2, y1],
              [x3, y1],
              [x4, y2],
              [x3, y3],
              [x2, y3],
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

export const computeGriddedLayer = (
  data: GeoJSONFeatureCollection,
  params: GriddedLayerParameters,
): GeoJSONFeatureCollection => {
  // Steps are as follows:
  // 0.
  // 1. Create a grid of cells (respecting the choice of the user)
  // 2. Intersect the grid with the data layer
  // 3. Compute the value of each cell
  // 4. Return the grid with the computed values
  const projectedData = reprojWithD3(globalStore.projection, data);
  const extent = bbox(projectedData) as [number, number, number, number];
  const grid = params.cellType === 'square'
    ? generateSquareGrid(extent, params.gridParameters.resolution * 1000)
    : generateHexGrid(extent, params.gridParameters.resolution * 1000);
  const projectedGrid = reprojWithD3(globalStore.projection, grid, true);
  console.log(projectedGrid);
  return projectedGrid;
};

export const noop = () => {};
