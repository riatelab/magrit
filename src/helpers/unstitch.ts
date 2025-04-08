import d3 from './d3-custom';
import rewindLayer from './rewind';
import type { FeatureCollection } from 'geojson';

// From https://github.com/d3/d3-geo/issues/113
export default function unstitch(a: FeatureCollection): FeatureCollection {
  let d = JSON.parse(JSON.stringify(a)) as FeatureCollection;
  d = d3.geoProject(
    d,
    d3
      .geoEquirectangular()
      .scale(180 / Math.PI)
      .translate([0, 0]),
  );

  d.features.forEach((feature) => {
    const f = feature.geometry;
    if (f.type === 'Polygon') {
      f.coordinates.forEach((ring) => {
        ring.forEach((point) => {
          // eslint-disable-next-line no-param-reassign
          point[1] *= -1;
        });
      });
    } else if (f.type === 'MultiPolygon') {
      f.coordinates.forEach((poly) => {
        poly.forEach((ring) => {
          ring.forEach((point) => {
            // eslint-disable-next-line no-param-reassign
            point[1] *= -1;
          });
        });
      });
    }
  });

  return rewindLayer(a);
}
