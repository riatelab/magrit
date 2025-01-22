/**
 * The code in this file rewinds GeoJSON polygons and multipolygons to fit d3's expectations.
 * This is adapted from a notebook of Philippe Rivière: https://observablehq.com/@fil/rewind
 * which is licensed under the ISC license.
 */
import d3 from './d3-custom';
import type {
  GeoJSONFeature, GeoJSONFeatureCollection, GeoJSONGeometry, GeoJSONGeometryType,
} from '../global';

const {
  geoTransform,
  geoStream,
  geoContains,
  geoArea,
} = d3;

function projectPolygons(o: GeoJSONGeometry, stream: d3.GeoStream) {
  let coordinates = [];
  let polygon; let
    line;
  geoStream(
    o,
    stream({
      polygonStart() {
        coordinates.push((polygon = []));
      },
      polygonEnd() {},
      lineStart() {
        polygon.push((line = []));
      },
      lineEnd() {
        line.push(line[0].slice());
      },
      point(x: number, y: number) {
        line.push([x, y]);
      },
    }),
  );
  if (o.type === 'Polygon') {
    // eslint-disable-next-line prefer-destructuring
    coordinates = coordinates[0];
  }
  return { ...o, coordinates, rewind: true };
}

function projectGeometry(o: GeoJSONGeometryType, stream: d3.GeoStream) {
  // eslint-disable-next-line no-nested-ternary
  return !o
    ? null
    : o.type === 'GeometryCollection' // eslint-disable-line no-nested-ternary
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      ? projectGeometryCollection(o, stream)
      : o.type === 'Polygon' || o.type === 'MultiPolygon'
        ? projectPolygons(o, stream)
        : o;
}

function projectFeature(o: GeoJSONFeature, stream: d3.GeoStream) {
  return { ...o, geometry: projectGeometry(o.geometry, stream) };
}

function projectFeatureCollection(o: GeoJSONFeatureCollection, stream: d3.GeoStream) {
  return { ...o, features: o.features.map((f) => projectFeature(f, stream)) };
}

function projectGeometryCollection(obj, stream: d3.GeoStream) {
  return {
    ...obj,
    geometries: obj.geometries.map((o: GeoJSONGeometry) => projectGeometry(o, stream)),
  };
}

const geoProjectSimple = (
  object: GeoJSONFeature | GeoJSONFeatureCollection | GeoJSONGeometry,
  projection: d3.GeoProjection,
) => {
  const { stream } = projection;
  let project;
  if (!stream) throw new Error('invalid projection');
  switch (object && object.type) {
    case 'Feature':
      project = projectFeature;
      break;
    case 'FeatureCollection':
      project = projectFeatureCollection;
      break;
    default:
      project = projectGeometry;
      break;
  }
  return project(object, stream);
};

function geoRewindStream(simple = true) {
  let ring;
  let polygon;
  return geoTransform({
    polygonStart() {
      this.stream.polygonStart();
      polygon = [];
    },
    lineStart() {
      if (polygon) polygon.push((ring = []));
      else this.stream.lineStart();
    },
    lineEnd() {
      if (!polygon) this.stream.lineEnd();
    },
    point(x, y) {
      if (polygon) ring.push([x, y]);
      else this.stream.point(x, y);
    },
    polygonEnd() {
      // eslint-disable-next-line no-restricted-syntax
      for (const [i, rring] of polygon.entries()) {
        rring.push(rring[0].slice());
        if (
          i // eslint-disable-line no-nested-ternary
            // a hole must contain the first point of the polygon
            ? !geoContains(
              { type: 'Polygon', coordinates: [rring] },
              polygon[0][0],
            )
            : polygon[1]
              // the outer ring must contain the first point of its first hole (if any)
              ? !geoContains(
                { type: 'Polygon', coordinates: [rring] },
                polygon[1][0],
              // eslint-disable-next-line @typescript-eslint/no-loop-func
              ) && !rring.some((p) => p[0] === polygon[1][0][0] && p[1] === polygon[1][0][1])
              // a single ring polygon must be smaller than a hemisphere (optional)
              : simple && geoArea({ type: 'Polygon', coordinates: [rring] }) > 2 * Math.PI
        ) {
          rring.reverse();
        }

        this.stream.lineStart();
        rring.pop();
        // eslint-disable-next-line no-restricted-syntax
        for (const [x, y] of rring) this.stream.point(x, y);
        this.stream.lineEnd();
      }
      this.stream.polygonEnd();
      polygon = null;
    },
  });
}

const rewindFeature = (
  feature: GeoJSONFeature,
  simple: boolean,
) => geoProjectSimple(feature, geoRewindStream(simple));

const rewindLayer = (
  layer: GeoJSONFeatureCollection,
  simple: boolean = true,
): GeoJSONFeatureCollection => {
  const features = layer.features.map((feature) => rewindFeature(feature, simple));
  return { ...layer, features };
};

export default rewindLayer;
