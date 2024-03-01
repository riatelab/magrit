import { distance } from '@turf/turf';
import { GeoJSONFeature, GeoJSONFeatureCollection } from '../global';

export default function createLinksData(
  ptsLayer: GeoJSONFeatureCollection,
  table: object[],
  layerIdentifierVariable: string,
  tableOriginVariable: string,
  tableDestinationVariable: string,
  tableIntensityVariable: string,
): GeoJSONFeatureCollection {
  const linksData = {
    type: 'FeatureCollection',
    features: [],
  };

  const pts = new Map(
    ptsLayer.features
      .map((d) => [d.properties[layerIdentifierVariable], d.geometry.coordinates]),
  );

  table.forEach((d) => {
    const origin = pts.get(d[tableOriginVariable]);
    const destination = pts.get(d[tableDestinationVariable]);
    if (origin && destination) {
      linksData.features.push({
        type: 'Feature',
        properties: {
          // We copy all the properties of the table
          // (maybe it contains some useful information)
          ...d,
          Origin: d[tableOriginVariable],
          Destination: d[tableDestinationVariable],
          Intensity: d[tableIntensityVariable],
          // And we add distance between origin and destination
          DistanceKm: distance(origin, destination, { units: 'kilometers' }),
        },
        geometry: {
          type: 'LineString',
          coordinates: [origin, destination],
        },
      } as GeoJSONFeature);
    }
  });

  return linksData;
}
