import {
  degToRadConstant, Mceil, Mcos, Mfloor, Msin, SQRT3,
} from './math';

import { GeoJSONFeatureCollection, GridCellShape } from '../global.d';

export const transformResolution = (
  resolution: number,
  cellType: GridCellShape,
): number => {
  if (cellType === 'hexagon') return resolution / SQRT3;
  return resolution;
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
  const rows = Mceil((ymax - ymin) / height) + 1;
  const cols = Mceil((xmax - xmin) / height) + 2;

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
  let [xmin, ymin, xmax, ymax] = extent;
  // TODO... why does it seems like we need to adjust the extent
  //         when clipping the grid afterwards.. but when using the
  //         non-clipped grid, we don't need to do that?
  xmin -= cellSize / 2;
  ymin -= cellSize / 2;
  xmax += cellSize * 2.5;
  ymax += cellSize * 2.5;
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

export const gridFunctions = {
  square: generateSquareGrid,
  hexagon: generateHexGrid,
  triangle: generateTriangularGrid,
  diamond: generateDiamondGrid,
};
