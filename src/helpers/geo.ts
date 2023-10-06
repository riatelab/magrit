import {
  area,
  booleanPointInPolygon,
  nearestPoint,
  pointOnFeature,
} from '@turf/turf';
import * as polylabel from 'polylabel';

import d3 from './d3-custom';
import { max } from './math';
import { GeoJSONGeometry, IZoomable } from '../global';
import { globalStore } from '../store/GlobalStore';

export const getLargestPolygon = (geom: GeoJSONGeometry) => {
  const areas = [];
  for (let j = 0; j < geom.coordinates.length; j++) { // eslint-disable-line no-plusplus
    areas.push(area({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: geom.coordinates[j],
      },
      properties: {},
    }));
  }
  const ix = areas.indexOf(max(areas));
  return {
    type: 'Polygon',
    coordinates: geom.coordinates[ix],
  };
};

export const coordsPointOnFeature = (geom) => {
  if (!geom) return null;
  if (geom.type === 'Point') {
    // Return the point itself
    return geom.coordinates;
  }
  if (geom.type === 'MultiPoint') {
    // Return the first point of the multipoint
    return geom.coordinates[0];
  }
  if (geom.type.includes('Line')) {
    // Return a point on the line or on the first line if multiline
    return pointOnFeature({ type: 'Feature', geometry: geom }).geometry.coordinates;
  }
  // Implement our logic for polygon centroid, or inaccessibility pole or nearest point
  // to centroid on polygon boundary
  if (geom.type.includes('Polygon')) {
    // Take the largest Polygon if MultiPolygon
    const tGeom = geom.type.includes('Multi')
      ? getLargestPolygon(geom)
      : geom;
    // Compute centroid
    const centroid = d3.geoCentroid(tGeom);
    // Return centroid coordinates if they are inside the target polygon ...
    if (booleanPointInPolygon(centroid, tGeom, { ignoreBoundary: true })) {
      return centroid;
    }
    // Otherwise compute the inaccessibility pole
    const inaccessibilityPole = polylabel(tGeom.coordinates, 1.0);
    // Return inaccessibility pole if it lies inside the target polygon
    if (booleanPointInPolygon(inaccessibilityPole, tGeom, { ignoreBoundary: true })) {
      return inaccessibilityPole;
    }
    // Otherwise compute the nearest point to the centroid on
    // the exterior ring of the target polygon (as with turf/pointOnFeature)
    // and return it
    const vertices = {
      type: 'FeatureCollection',
      features: tGeom.coordinates[0].map((c) => ({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: c,
        },
      })),
    };
    return nearestPoint(centroid, vertices).geometry.coordinates;
  }

  return null;
};

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
    // Redraw the paths
    g.querySelectorAll('path').forEach((p) => {
      p.setAttribute('d', globalStore.pathGenerator(p.__data__)); // eslint-disable-line no-underscore-dangle
    });
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
  });
  // Also redraw the path elements in the defs
  svgElement.querySelectorAll('defs path').forEach((p) => {
    // eslint-disable-next-line no-underscore-dangle
    p.setAttribute('d', globalStore.pathGenerator(p.__data__));
  });
};
