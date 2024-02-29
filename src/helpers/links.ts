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
          [tableIntensityVariable]: d[tableIntensityVariable],
          Origin: d[tableOriginVariable],
          Destination: d[tableDestinationVariable],
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
