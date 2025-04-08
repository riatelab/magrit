import type { FeatureCollection, Feature, Polygon } from 'geojson';
import { geojsonToGeosGeom, geosGeomToGeojson } from 'geos-wasm/helpers';
import getGeos from './geos';
import topojson from './topojson';

export default async function aggregateLayer(
  layer: FeatureCollection,
  variable: string,
  method: 'geos' | 'topojson',
): Promise<FeatureCollection> {
  // The set of unique values of the variable
  const uniqueValues = new Set(layer.features.map((f) => f.properties[variable]));
  // The features, grouped according to the unique values of the variable
  const featureGroups = Array.from(uniqueValues).map((value) => layer.features
    .filter((f) => f.properties[variable] === value));

  if (method === 'geos') {
    const newFeatures: Feature[] = [];
    const geos = await getGeos();
    // We need to union the features of each group
    featureGroups.forEach((group) => {
      const geomPtr = geojsonToGeosGeom(
        {
          type: 'FeatureCollection',
          features: group,
        },
        geos,
      );
      const unionPtr = geos.GEOSUnaryUnion(geomPtr);
      const unionGeom = geosGeomToGeojson(unionPtr, geos);
      const ft = {
        type: 'Feature',
        properties: {},
        geometry: unionGeom,
      } as Feature<Polygon, Record<string, unknown>>;

      if (variable !== '') {
        ft.properties[variable] = group[0].properties[variable];
      }

      newFeatures.push(ft);
      geos.GEOSGeom_destroy(geomPtr);
      geos.GEOSGeom_destroy(unionPtr);
    });

    return {
      type: 'FeatureCollection',
      features: newFeatures,
    };
  }
  // Otherwise, method === 'topojson'
  const newFeatures: Feature[] = [];
  featureGroups.forEach((group) => {
    const topo = topojson.topology({ collection: { type: 'FeatureCollection', features: group } });
    const mergedPolygon = topojson.merge(
      topo,
      topo.objects.collection.geometries,
    );
    const ft = {
      type: 'Feature',
      properties: {},
      geometry: mergedPolygon,
    } as Feature<never, Record<string, unknown>>;

    if (variable !== '') {
      ft.properties[variable] = group[0].properties[variable];
    }

    newFeatures.push(ft);
  });
  return {
    type: 'FeatureCollection',
    features: newFeatures,
  };
}
