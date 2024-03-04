import { distance } from '@turf/turf';
import { GeoJSONFeature, GeoJSONFeatureCollection } from '../global';

function createLinksData(
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
      .map((d) => [`${d.properties[layerIdentifierVariable]}`, d.geometry.coordinates]),
  );

  table.forEach((d) => {
    const origin = pts.get(`${d[tableOriginVariable]}`);
    const destination = pts.get(`${d[tableDestinationVariable]}`);
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

function createSimpleLinksData(
  ptsLayer: GeoJSONFeatureCollection,
  table: object[],
  layerIdentifierVariable: string,
  tableOriginVariable: string,
  tableDestinationVariable: string,
  tableIntensityVariable?: string,
) {
  const linksData = {
    type: 'FeatureCollection',
    features: [],
  };

  const pts = new Map(
    ptsLayer.features
      .map((d) => [`${d.properties[layerIdentifierVariable]}`, d.geometry.coordinates]),
  );

  // If there is an tableIntensityVariable, we use it to create links when
  // it is present and superior to 0.
  // We also want to ensure that their is only one link for A => B and B => A
  if (tableIntensityVariable) {
    const links = new Map();
    table.forEach((d) => {
      const origin = pts.get(`${d[tableOriginVariable]}`);
      const destination = pts.get(`${d[tableDestinationVariable]}`);
      if (origin && destination) {
        const key = `${d[tableOriginVariable]}_${d[tableDestinationVariable]}`;
        const keyReversed = `${d[tableDestinationVariable]}_${d[tableOriginVariable]}`;
        if (+d[tableIntensityVariable] > 0) {
          if (links.has(key)) {
            links.set(key, links.get(key) + +d[tableIntensityVariable]);
          } else if (links.has(keyReversed)) {
            links.set(keyReversed, links.get(keyReversed) + +d[tableIntensityVariable]);
          } else {
            links.set(key, +d[tableIntensityVariable]);
          }
        }
      }
    });

    links.forEach((value, key) => {
      const [origin, destination] = key.split('_');
      linksData.features.push({
        type: 'Feature',
        properties: {
          Origin: origin,
          Destination: destination,
          Intensity: value,
        },
        geometry: {
          type: 'LineString',
          coordinates: [pts.get(origin), pts.get(destination)],
        },
      } as GeoJSONFeature);
    });
  } else {
    // If there is no tableIntensityVariable, we create a link for each row,
    // still taking care of not creating two links for A => B and B => A
    const links = new Set();
    table.forEach((d) => {
      const origin = pts.get(`${d[tableOriginVariable]}`);
      const destination = pts.get(`${d[tableDestinationVariable]}`);
      if (origin && destination) {
        const key = `${d[tableOriginVariable]}_${d[tableDestinationVariable]}`;
        const keyReversed = `${d[tableDestinationVariable]}_${d[tableOriginVariable]}`;
        if (!links.has(key) && !links.has(keyReversed)) {
          links.add(key);
          links.add(keyReversed);
          linksData.features.push({
            type: 'Feature',
            properties: {
              Origin: d[tableOriginVariable],
              Destination: d[tableDestinationVariable],
            },
            geometry: {
              type: 'LineString',
              coordinates: [origin, destination],
            },
          } as GeoJSONFeature);
        }
      }
    });
  }

  return linksData;
}

export {
  createSimpleLinksData,
  createLinksData,
};
