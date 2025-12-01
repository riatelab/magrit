import type { Feature } from 'geojson';
import d3 from './d3-custom';
import { globalStore } from '../store/GlobalStore';
import {
  degToRadConstant, Mcos, Mfloor, Mround, Msin,
} from './math';
import {
  type ID3Element,
  type IZoomable,
  LinkCurvature,
  SymbolType,
} from '../global.d';

/**
 * Get the SVG map element.
 *
 * @returns {SVGSVGElement & IZoomable}
 * @throws {Error} - If the SVG element could not be found.
 */
export const getTargetSvg = (): SVGSVGElement & IZoomable => {
  const targetSvg = document.querySelector('svg.map-zone__map');
  if (!targetSvg) {
    throw new Error('Could not find SVG element');
  }
  return targetSvg as SVGSVGElement & IZoomable;
};

export const createTrianglePath = (x: number, y: number, size: number): string => {
  // Height of an equilateral triangle
  const height = (Math.sqrt(3) / 2) * size;

  // Triangle vertices
  const a = { x: x - size / 2, y: y + height / 3 };
  const b = { x: x + size / 2, y: y + height / 3 };
  const c = { x, y: y - (2 * height) / 3 };

  return `M ${a.x} ${a.y} L ${b.x} ${b.y} L ${c.x} ${c.y} Z`;
};

export const createSquarePath = (x: number, y: number, size: number): string => {
  const halfSize = size / 2;
  return `M ${x - halfSize} ${y - halfSize} L ${x + halfSize} ${y - halfSize} L ${x + halfSize} ${y + halfSize} L ${x - halfSize} ${y + halfSize} Z`;
};

export const createDiamondPath = (x: number, y: number, size: number): string => {
  const halfSize = size / 2;
  return `M ${x} ${y - halfSize} L ${x + halfSize} ${y} L ${x} ${y + halfSize} L ${x - halfSize} ${y} Z`;
};

export const createDiamond2Path = (x: number, y: number, size: number): string => {
  const width = size * 0.8;
  const height = size * 1.2;
  return `M ${x} ${y - height / 2} L ${x + width / 2} ${y} L ${x} ${y + height / 2} L ${x - width / 2} ${y} Z`;
};

export const createCrossPath = (x: number, y: number, size: number): string => {
  const s = size / 2;
  const a = s / 4;
  return `M ${x + a} ${y - s} L ${x + a} ${y - a} L ${x + s} ${y - a} L ${x + s} ${y + a} L ${x + a} ${y + a} L ${x + a} ${y + s} L ${x - a} ${y + s} L ${x - a} ${y + a} L ${x - s} ${y + a} L ${x - s} ${y - a} L ${x - a} ${y - a} L ${x - a} ${y - s} Z`;
};

export const createStarPath = (x: number, y: number, size: number): string => {
  let pathData = 'M ';
  for (let i = 0; i < 5; i += 1) {
    let angleDeg = 72 * i - 90;
    let angleRad = degToRadConstant * angleDeg;
    pathData += `${x + size * Mcos(angleRad)} ${y + size * Msin(angleRad)} `;
    angleDeg += 36;
    angleRad = degToRadConstant * angleDeg;
    pathData += `${x + (size / 2) * Mcos(angleRad)} ${y + (size / 2) * Msin(angleRad)} `;
  }
  pathData += 'Z';
  return pathData;
};

export const createCirclePath = (x: number, y: number, size: number): string => {
  const r = size / 2;
  return `M ${x + r} ${y} A ${r} ${r} 0 0 1 ${x - r} ${y} A ${r} ${r} 0 0 1 ${x + r} ${y}`;
};

export const getSymbolPath = (
  symbolType: SymbolType,
  coordinates: [number, number],
  size: number,
): string => {
  const [x, y] = coordinates;
  switch (symbolType) {
    case 'circle':
      return createCirclePath(x, y, size);
    case 'square':
      return createSquarePath(x, y, size);
    case 'diamond':
      return createDiamondPath(x, y, size);
    case 'diamond2':
      return createDiamond2Path(x, y, size);
    case 'triangle':
      return createTrianglePath(x, y, size);
    case 'cross':
      return createCrossPath(x, y, size);
    case 'star':
      return createStarPath(x, y, size);
    default:
      return '';
  }
};

export const linkPath = (
  feature: Feature,
  pathGenerator: ((feature: Feature) => string),
  projection: ((coordinates: [number, number]) => [number, number]),
  linkCurvature: LinkCurvature,
): string => {
  switch (linkCurvature) {
    case LinkCurvature.StraightOnPlane: {
      const pt1 = projection((feature.geometry.coordinates as [number, number][])[0]);
      const pt2 = projection((feature.geometry.coordinates as [number, number][])[1]);
      return `M ${pt1[0]},${pt1[1]} L ${pt2[0]},${pt2[1]}`;
    }
    case LinkCurvature.Curved: {
      const pt1 = projection((feature.geometry.coordinates as [number, number][])[0]);
      const pt2 = projection((feature.geometry.coordinates as [number, number][])[1]);
      // Compute a point on the bisector of the segment [pt1, pt2]
      const bisector = [
        (pt1[0] + pt2[0]) / 2,
        (pt1[1] + pt2[1]) / 2,
      ];
      // Compute the distance between the two points
      const distance = Math.sqrt(
        (pt2[0] - pt1[0]) ** 2 + (pt2[1] - pt1[1]) ** 2,
      );
      // Compute the control point for the quadratic Bezier curve
      const controlPoint = [
        bisector[0] + ((distance / 2) * (pt2[1] - pt1[1])) / (distance * 2),
        bisector[1] + ((distance / 2) * (pt1[0] - pt2[0])) / (distance * 2),
      ];

      return `M ${pt1[0]},${pt1[1]} Q ${controlPoint[0]},${controlPoint[1]} ${pt2[0]},${pt2[1]}`;
    }
    case LinkCurvature.StraightOnSphere:
    default:
      return pathGenerator(feature);
  }
};

export const semiCirclePath = (
  radius: number,
  cx: number,
  cy: number,
  position: 'top' | 'bottom',
): string => {
  const startX = cx - radius;
  const startY = cy;
  const endX = cx + radius;
  const endY = cy;
  const sweepFlag = position === 'top' ? 1 : 0;
  return `M ${startX} ${startY} A ${radius} ${radius} 0 0 ${sweepFlag} ${endX} ${endY} L ${startX} ${startY}`;
};

const simpleRedrawRenderers = new Set(
  [
    'default',
    'choropleth',
    'smoothed',
    'discontinuity',
    'graticule',
    'sphere',
    'categoricalChoropleth',
    'cartogram',
    'grid',
    'bivariateChoropleth',
    'trivariateChoropleth',
  ],
);

/**
 * Redraw the paths of the SVG element
 * as well as the various symbols (circles, ...), using the updated projection.
 *
 * @param {SVGSVGElement & IZoomable} svgElement
 */
export const redrawPaths = (svgElement: SVGSVGElement & IZoomable) => {
  // We need to reset the __zoom property of the svg element
  // to the zoomIdentity, otherwise the zoom will not work anymore.
  // eslint-disable-next-line no-underscore-dangle, no-param-reassign
  svgElement.__zoom = d3.zoomIdentity;

  const {
    width,
    height,
  } = svgElement.getBoundingClientRect();

  let currentClipExtent;

  // For each layer...
  svgElement.querySelectorAll('g.layer').forEach((g) => {
    // Remove the transform attribute from the elements on which it was defined
    g.removeAttribute('transform');
    // Get the type of portrayal stored in a custom attribute
    const typePortrayal = g.getAttribute('mgt:portrayal-type')!;
    // Redraw the paths according to the type of portrayal
    if (
      (
        simpleRedrawRenderers.has(typePortrayal)
        && g.getAttribute('mgt:geometry-type')! !== 'point'
      )
      || (
        typePortrayal === 'proportionalSymbols'
        && g.getAttribute('mgt:geometry-type')! === 'linestring'
      )
    ) {
      if (typePortrayal === 'graticule') {
        // We clip the graticule for performance reasons
        // TODO: we should have a flag saying "we are exporting to svg"
        //   and not clip the graticule (if user request a non-clipped svg export)
        currentClipExtent = globalStore.projection.clipExtent();
        globalStore.projection.clipExtent([[0, 0], [width, height]]);
      }

      g.querySelectorAll('path').forEach((p) => {
        p.setAttribute(
          'd', // eslint-disable-next-line no-underscore-dangle
          globalStore.pathGenerator((p as SVGPathElement & ID3Element).__data__),
        );
      });

      // Reset the clipExtent to the default value
      if (typePortrayal === 'graticule') {
        globalStore.projection.clipExtent(currentClipExtent!);
      }
    } else if (
      simpleRedrawRenderers.has(typePortrayal)
      && g.getAttribute('mgt:geometry-type')! === 'point'
    ) {
      const size = +g.getAttribute('mgt:symbol-size')!;
      const symbol = g.getAttribute('mgt:symbol-type')!;
      g.querySelectorAll('path').forEach((p) => {
        const coords = globalStore.pathGenerator.centroid(
          // eslint-disable-next-line no-underscore-dangle
          (p as SVGPathElement & ID3Element).__data__.geometry,
        );
        if (!Number.isNaN(coords[0])) {
          p.setAttribute(
            'd', // eslint-disable-next-line no-underscore-dangle
            getSymbolPath(symbol as SymbolType, coords, size),
          );
          p.setAttribute('visibility', 'visible');
        } else {
          p.setAttribute('visibility', 'hidden');
        }
      });
    } else if (typePortrayal === 'proportionalSymbols') {
      // Redraw the symbols (circles)
      g.querySelectorAll('circle').forEach((c) => {
        const projectedCoords = globalStore.pathGenerator.centroid(
          // eslint-disable-next-line no-underscore-dangle
          (c as SVGCircleElement & ID3Element).__data__.geometry,
        );
        if (!Number.isNaN(projectedCoords[0])) {
          c.setAttribute('cx', `${projectedCoords[0]}`);
          c.setAttribute('cy', `${projectedCoords[1]}`);
          c.setAttribute('visibility', 'visible');
        } else {
          c.setAttribute('visibility', 'hidden');
        }
      });
      // Redraw the symbols (squares)
      g.querySelectorAll('rect').forEach((r) => {
        const projectedCoords = globalStore.pathGenerator.centroid(
          // eslint-disable-next-line no-underscore-dangle
          (r as SVGRectElement & ID3Element).__data__.geometry,
        );
        if (!Number.isNaN(projectedCoords[0])) {
          const size = +r.getAttribute('width')!;
          r.setAttribute('x', `${projectedCoords[0] - size / 2}`);
          r.setAttribute('y', `${projectedCoords[1] - size / 2}`);
          r.setAttribute('visibility', 'visible');
        } else {
          r.setAttribute('visibility', 'hidden');
        }
      });
    } else if (typePortrayal === 'categoricalPictogram') {
      g.querySelectorAll(':scope > g').forEach((gg) => {
        const projectedCoords = globalStore.pathGenerator.centroid(
          // eslint-disable-next-line no-underscore-dangle
          (gg as SVGGElement & ID3Element).__data__.geometry,
        );
        if (!Number.isNaN(projectedCoords[0])) {
          const iconDimension = JSON.parse(gg.getAttribute('mgt:icon-dimension')!);
          const img = gg.childNodes[0] as SVGImageElement;
          img.setAttribute('x', `${projectedCoords[0] - iconDimension[0] / 2}`);
          img.setAttribute('y', `${projectedCoords[1] - iconDimension[1] / 2}`);
          gg.setAttribute('visibility', 'visible');
        } else {
          gg.setAttribute('visibility', 'hidden');
        }
      });
    } else if (typePortrayal === 'mushrooms') {
      const pos = ['top', 'bottom'];
      // Redraw the symbols (circles)
      g.querySelectorAll('g').forEach((gg) => {
        const projectedCoords = globalStore.pathGenerator.centroid(
          // eslint-disable-next-line no-underscore-dangle
          (gg as SVGGElement & ID3Element).__data__.geometry,
        );
        if (!Number.isNaN(projectedCoords[0])) {
          gg.querySelectorAll('path').forEach((p, i) => {
            const sizeValue = p.getAttribute('mgt:size-value')!;
            p.setAttribute(
              'd',
              semiCirclePath(
                +sizeValue,
                projectedCoords[0],
                projectedCoords[1],
                pos[i] as 'top' | 'bottom',
              ),
            );
          });
          gg.setAttribute('visibility', 'visible');
        } else {
          gg.setAttribute('visibility', 'hidden');
        }
      });
    } else if (typePortrayal === 'labels') {
      g.querySelectorAll('text').forEach((t) => {
        const c = globalStore.pathGenerator // eslint-disable-next-line no-underscore-dangle
          .centroid((t as SVGTextElement & ID3Element).__data__.geometry);
        if (!Number.isNaN(c[0])) {
          const offsetX = +(t.getAttribute('mgt:offset-x') || 0);
          const offsetY = +(t.getAttribute('mgt:offset-y') || 0);
          t.setAttribute('x', `${c[0] + offsetX}`);
          t.setAttribute('y', `${c[1] + offsetY}`);
          t.setAttribute('visibility', 'visible');
        } else {
          t.setAttribute('visibility', 'hidden');
        }
      });
    } else if (typePortrayal === 'links') {
      const linkCurvature = g.getAttribute('mgt:link-curvature')!;
      g.querySelectorAll('path').forEach((p) => {
        p.setAttribute('d', linkPath(
          (p as SVGPathElement & ID3Element).__data__, // eslint-disable-line no-underscore-dangle
          globalStore.pathGenerator,
          globalStore.projection,
          linkCurvature as LinkCurvature,
        ));
      });
    } else if (typePortrayal === 'waffle') {
      const symbolType = g.getAttribute('mgt:symbol-type')!;
      const size = +g.getAttribute('mgt:size')!;
      const spacing = +g.getAttribute('mgt:spacing')!;
      const horizontalAnchor = g.getAttribute('mgt:horizontalAnchor')!;
      const verticalAnchor = g.getAttribute('mgt:verticalAnchor')!;

      g.querySelectorAll('g').forEach((gg) => {
        const columns = +gg.getAttribute('mgt:columns')!;
        const totalSymbols = +gg.getAttribute('mgt:totalSymbols')!;
        const coords = globalStore.pathGenerator.centroid(
          // eslint-disable-next-line no-underscore-dangle
          (gg as SVGGElement & ID3Element).__data__.geometry,
        );
        if (!Number.isNaN(coords[0])) {
          let offsetCentroidX = 0; // value for horizontalAnchor = 'start'
          if (symbolType === 'circle') {
            if (horizontalAnchor === 'middle') {
              offsetCentroidX = (size + spacing) * (columns / 2) - (size * 0.5);
            } else if (horizontalAnchor === 'end') {
              offsetCentroidX = (size + spacing) * columns - size;
            }
          } else { // eslint-disable-next-line no-lonely-if
            if (horizontalAnchor === 'middle') {
              offsetCentroidX = (size + spacing) * (columns / 2);
            } else if (horizontalAnchor === 'end') {
              offsetCentroidX = (size + spacing) * columns;
            }
          }
          let offsetCentroidY = 0; // value for verticalAnchor = 'bottom'
          if (symbolType === 'circle') {
            if (verticalAnchor === 'middle') {
              offsetCentroidY = (size + spacing) * (Mfloor(
                totalSymbols / columns,
              ) / 2);
            } else if (verticalAnchor === 'top') {
              offsetCentroidY = (size + spacing) * Mfloor(totalSymbols / columns);
            }
          } else { // eslint-disable-next-line no-lonely-if
            if (verticalAnchor === 'middle') {
              offsetCentroidY = (size + spacing) * (Mfloor(totalSymbols / columns) / 2);
            } else if (verticalAnchor === 'top') {
              offsetCentroidY = (size + spacing) * Mfloor(totalSymbols / columns);
            }
          }
          let symbolIndex = 0;
          if (symbolType === 'circle') {
            gg.querySelectorAll('circle').forEach((c) => {
              const tx = Mround(
                (symbolIndex % columns) * (size + spacing),
              );
              const ty = Mfloor(
                Mfloor(symbolIndex / columns) * (size + spacing),
              );
              symbolIndex += 1;
              c.setAttribute('cx', `${coords[0] - offsetCentroidX + tx}`);
              c.setAttribute('cy', `${coords[1] + offsetCentroidY - (size / 2) - ty}`);
            });
          } else { // symbolType === 'square'
            gg.querySelectorAll('rect').forEach((r) => {
              const tx = Mround(
                (symbolIndex % columns) * (size + spacing),
              );
              const ty = Mfloor(
                Mfloor(symbolIndex / columns) * (size + spacing),
              );
              r.setAttribute('x', `${coords[0] - offsetCentroidX + tx}`);
              r.setAttribute('y', `${coords[1] + offsetCentroidY - size - ty}`);
              symbolIndex += 1;
            });
          }
          gg.setAttribute('visibility', 'visible');
        } else {
          gg.setAttribute('visibility', 'hidden');
        }
      });
    }
  });
  // Also redraw the path elements in the defs
  // (we use :scope to select only the direct children of the current SVG element: maybe
  // the user included some custom SVG images as layout features and we dont want
  // to mess with them).
  svgElement.querySelectorAll(':scope > defs clipPath > path').forEach((p) => {
    p.setAttribute(
      'd',
      // eslint-disable-next-line no-underscore-dangle
      globalStore.pathGenerator((p as SVGPathElement & ID3Element).__data__),
    );
  });
};
