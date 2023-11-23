function area(upperLeft: { x: number, y: number }, lowerRight: { x: number, y: number }) {
  if (upperLeft.x > lowerRight.x || upperLeft.y > lowerRight.y) return 0;
  return ((lowerRight.x + 1) - (upperLeft.x)) * ((lowerRight.y + 1) - (upperLeft.y));
}

function updateCache(mat: number[][], rows: number, x: number, cache: number[]) {
  for (let y = 0; y < rows; y += 1) {
    if (mat[x][y] === 1) cache[y]++; // eslint-disable-line no-param-reassign, no-plusplus
    else cache[y] = 0; // eslint-disable-line no-param-reassign
  }
}

function fillMat(mat: number[][], xs: any[], ys: any[]) {
  for (let x = xs[0]; x < xs[1]; x += 1) {
    for (let y = ys[0]; y < ys[1]; y += 1) {
      mat[x][y] = 0; // eslint-disable-line no-param-reassign
    }
  }
}

function getMaxRect(
  mat: number[][],
  rows: number,
  cols: number,
  minQuadX = 40,
  minQuadY = 100,
): { x: number, y: number, lenX: number, lenY: number, area: number } {
  const cache = new Array(rows + 1);
  const stack = [];
  let bestUpperLeft = { x: -1, y: -1 };
  let bestLowerRight = { x: -1, y: -1 };

  for (let i = 0; i < cache.length; i += 1) {
    cache[i] = 0;
  }

  for (let x = cols - 1; x >= 0; x -= 1) {
    updateCache(mat, rows, x, cache);
    let width = 0;
    for (let y = 0; y < rows + 1; y += 1) {
      if (cache[y] > width) {
        stack.push({ y, width });
        width = cache[y];
      }
      if (cache[y] < width) {
        let y0;
        let w0;
        while (true) {
          const pop = stack.pop();
          y0 = pop!.y;
          w0 = pop!.width;
          if (((width * (y - y0)) > area(bestUpperLeft, bestLowerRight))
            && (y - y0 >= minQuadY) && (width >= minQuadX)) {
            bestUpperLeft = { x, y: y0 };
            bestLowerRight = { x: x + width - 1, y: y - 1 };
          }
          width = w0;
          if (cache[y] >= width) break;
        }
        width = cache[y];
        if (width !== 0) stack.push({ y: y0, width: w0 });
      }
    }
  }
  return {
    x: bestUpperLeft.x,
    y: bestUpperLeft.y,
    lenX: bestLowerRight.x - bestUpperLeft.x + 1,
    lenY: bestLowerRight.y - bestUpperLeft.y + 1,
    area: area(bestUpperLeft, bestLowerRight),
  };
}

/**
 * @description Return the maximal available rectangle in the map (i.e. without existing legends)
 * in order to place a new legend.
 * Implementation of the algorithm described in
 * http://www.codinghands.co.uk/blog/2013/02/javascript-implementation-omn-maximal-rectangle-algorithm/.
 *
 * @param {SVGGElement[]} legendNodes - The existing legend nodes
 * @param {{ width: number, height: number }} mapDimensions - The dimensions of the map
 * @param {{ x0: number, y0: number }} mapPosition - The position of the map inside the page
 * @param {{ width: number, height: number }} [minQuadDimensions={ width: 40, height: 100 }] - The
 * minimum dimensions of the bounding rectangle of the legend we are trying to position
 */
export default function getMaximalAvailableRectangle(
  legendNodes: NodeListOf<SVGGElement>,
  mapDimensions: { width: number, height: number },
  mapPosition: { x0: number, y0: number },
  minQuadDimensions: { width: number, height: number } = { width: 40, height: 100 },
): { x: number, y: number, lenX: number, lenY: number, area: number } {
  const minQuadY = minQuadDimensions.height;
  const minQuadX = minQuadDimensions.width;
  const cols = Math.floor(mapDimensions.width);
  const rows = Math.floor(mapDimensions.height);
  const mat: number[][] = [];

  for (let i = 0; i < cols; i += 1) {
    mat.push([]);
    for (let j = 0; j < rows; j += 1) {
      mat[i].push(1);
    }
  }

  for (let i = 0; i < legendNodes.length; i += 1) {
    const bbox = legendNodes[i].getBoundingClientRect();
    let bx = Math.floor(bbox.left - mapPosition.x0);
    let by = Math.floor(bbox.top - mapPosition.y0);
    if (bx < 0) bx = 0;
    if (by < 0) by = 0;
    const bx2 = (bx + Math.floor(bbox.width)) >= cols ? cols - 1 : bx + Math.floor(bbox.width);
    const by2 = (by + Math.floor(bbox.height)) >= rows ? rows - 1 : by + Math.floor(bbox.height);
    fillMat(mat, [bx, bx2], [by, by2]);
  }

  return getMaxRect(mat, rows, cols, minQuadX, minQuadY);
}
