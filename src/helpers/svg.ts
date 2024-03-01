import d3 from './d3-custom';
import { globalStore } from '../store/GlobalStore';
import {
  type GeoJSONFeature,
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
      const pt1 = projection(feature.geometry.coordinates[0]);
      const pt2 = projection(feature.geometry.coordinates[1]);
      return `M ${pt1[0]},${pt1[1]} L ${pt2[0]},${pt2[1]}`;
    }
    case LinkCurvature.Curved: {
      const pt1 = projection(feature.geometry.coordinates[0]);
      const pt2 = projection(feature.geometry.coordinates[1]);
      // Compute a point on the bisector of the segment [pt1, pt2]
      const bisector = [
        (pt1[0] + pt2[0]) / 2,
        (pt1[1] + pt2[1]) / 2,
      ];
      // Compute the distance between the two points
      const distance = Math.sqrt(
        (pt2[0] - pt1[0]) ** 2 + (pt2[1] - pt1[1]) ** 2,
      );
      // Compute the control point
      const controlPoint = [
        bisector[0] + distance / 4,
        bisector[1],
      ];
      return `M ${pt1[0]},${pt1[1]} Q ${controlPoint[0]},${controlPoint[1]} ${pt2[0]},${pt2[1]}`;
    }
    default:
      return pathGenerator(feature);
  }
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
      }

      g.querySelectorAll('path').forEach((p) => {
        p.setAttribute('d', globalStore.pathGenerator(p.__data__)); // eslint-disable-line no-underscore-dangle
      });
    } else if (typePortrayal === 'proportionalSymbols') {
      // Redraw the symbols (circles)
      g.querySelectorAll('circle').forEach((c) => {
        // eslint-disable-next-line no-underscore-dangle
        const projectedCoords = globalStore.projection(c.__data__.geometry.coordinates);
        c.setAttribute('cx', `${projectedCoords[0]}`);
        c.setAttribute('cy', `${projectedCoords[1]}`);
      });
      // Redraw the symbols (squares)
      g.querySelectorAll('rect').forEach((r) => {
        // eslint-disable-next-line no-underscore-dangle
        const projectedCoords = globalStore.projection(r.__data__.geometry.coordinates);
        const size = +r.getAttribute('width')!;
        r.setAttribute('x', `${projectedCoords[0] - size / 2}`);
        r.setAttribute('y', `${projectedCoords[1] - size / 2}`);
      });
    } else if (typePortrayal === 'labels') {
      g.querySelectorAll('text').forEach((t) => {
        // eslint-disable-next-line no-underscore-dangle
        const projectedCoords = globalStore.projection(t.__data__.geometry.coordinates);
        t.setAttribute('x', `${projectedCoords[0]}`);
        t.setAttribute('y', `${projectedCoords[1]}`);
      });
    } else if (typePortrayal === 'links') {
      const linkCurvature = g.getAttribute('mgt:link-curvature')!;
      g.querySelectorAll('path').forEach((p) => {
        p.setAttribute('d', linkPath(
          p.__data__, // eslint-disable-line no-underscore-dangle
          globalStore.pathGenerator,
          globalStore.projection,
          linkCurvature as LinkCurvature,
        ));
      });
    }
  });
  // Also redraw the path elements in the defs
  svgElement.querySelectorAll('defs clipPath > path').forEach((p) => {
    // eslint-disable-next-line no-underscore-dangle
    p.setAttribute('d', globalStore.pathGenerator(p.__data__));
  });
};
