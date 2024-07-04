import { geojsonToGeosGeom, geosGeomToGeojson } from 'geos-wasm/helpers';
import getGeos from './geos';
import topojson from './topojson';
import {
  type GeoJSONFeatureCollection,
  type GeoJSONFeature,
} from '../global';

export default async function aggregateLayer(
  layer: GeoJSONFeatureCollection,
  variable: string,
  method: 'geos' | 'topojson',
): Promise<GeoJSONFeatureCollection> {
  // The set of unique values of the variable
  const uniqueValues = new Set(layer.features.map((f) => f.properties[variable]));
  // The features, grouped according to the unique values of the variable
  const featureGroups = Array.from(uniqueValues).map((value) => layer.features
    .filter((f) => f.properties[variable] === value));

  if (method === 'geos') {
    const newFeatures: GeoJSONFeature[] = [];
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
      } as GeoJSONFeature;

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
  const newFeatures: GeoJSONFeature[] = [];
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
    } as GeoJSONFeature;

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
