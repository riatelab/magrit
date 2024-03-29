import d3 from './d3-custom';
import { globalStore } from '../store/GlobalStore';
import {
  type GeoJSONFeature,
  type ID3Element,
  type IZoomable,
  LinkCurvature,
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

export const linkPath = (
  feature: GeoJSONFeature,
  pathGenerator: ((feature: GeoJSONFeature) => string),
  projection: ((coordinates: [number, number]) => [number, number]),
  linkCurvature: LinkCurvature,
): string => {
  switch (linkCurvature) {
    case LinkCurvature.StraightOnSphere:
      return pathGenerator(feature);
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
        bisector[0] + ((distance) * (pt2[1] - pt1[1])) / distance,
        bisector[1] + ((distance) * (pt1[0] - pt2[0])) / distance,
      ];

      return `M ${pt1[0]},${pt1[1]} Q ${controlPoint[0]},${controlPoint[1]} ${pt2[0]},${pt2[1]}`;
    }
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
    if (simpleRedrawRenderers.has(typePortrayal)) {
      // We need to read the type of geometry
      // because we need to set the pointRadius for point geometries
      const type = g.getAttribute('mgt:geometry-type')!;
      if (type === 'point') {
        globalStore.pathGenerator.pointRadius(+g.getAttribute('mgt:point-radius')!);
      } else if (typePortrayal === 'graticule') {
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
    } else if (typePortrayal === 'proportionalSymbols') {
      // Redraw the symbols (circles)
      g.querySelectorAll('circle').forEach((c) => {
        const projectedCoords = globalStore.projection(
          // eslint-disable-next-line no-underscore-dangle
          (c as SVGCircleElement & ID3Element).__data__.geometry.coordinates,
        );
        c.setAttribute('cx', `${projectedCoords[0]}`);
        c.setAttribute('cy', `${projectedCoords[1]}`);
      });
      // Redraw the symbols (squares)
      g.querySelectorAll('rect').forEach((r) => {
        const projectedCoords = globalStore.projection(
          // eslint-disable-next-line no-underscore-dangle
          (r as SVGRectElement & ID3Element).__data__.geometry.coordinates,
        );
        const size = +r.getAttribute('width')!;
        r.setAttribute('x', `${projectedCoords[0] - size / 2}`);
        r.setAttribute('y', `${projectedCoords[1] - size / 2}`);
      });
    } else if (typePortrayal === 'mushrooms') {
      const pos = ['top', 'bottom'];
      // Redraw the symbols (circles)
      g.querySelectorAll('g').forEach((gg) => {
        const projectedCoords = globalStore.projection(
          // eslint-disable-next-line no-underscore-dangle
          (gg as SVGGElement & ID3Element).__data__.geometry.coordinates,
        );
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
      });
    } else if (typePortrayal === 'labels') {
      g.querySelectorAll('text').forEach((t) => {
        const projectedCoords = globalStore.projection(
          // eslint-disable-next-line no-underscore-dangle
          (t as SVGTextElement & ID3Element).__data__.geometry.coordinates,
        );
        t.setAttribute('x', `${projectedCoords[0]}`);
        t.setAttribute('y', `${projectedCoords[1]}`);
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
    }
  });
  // Also redraw the path elements in the defs
  svgElement.querySelectorAll('defs clipPath > path').forEach((p) => {
    p.setAttribute(
      'd',
      // eslint-disable-next-line no-underscore-dangle
      globalStore.pathGenerator((p as SVGPathElement & ID3Element).__data__),
    );
  });
};
