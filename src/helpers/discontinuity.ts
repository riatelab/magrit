// Stores
import { layersDescriptionStore } from '../store/LayersDescriptionStore';

// Helpers
import { isFiniteNumber, unproxify } from './common';
import topojson from './topojson';
import { Mmax } from './math';

// Types / Interfaces / Enums
import { GeoJSONFeature, GeoJSONFeatureCollection } from '../global';

const computeDiscontinuity = (
  referenceLayerId: string,
  referenceVariableName: string,
  discontinuityType: 'relative' | 'absolute',
): GeoJSONFeatureCollection => {
  // Get the reference layer data
  const refLayer = unproxify(
    layersDescriptionStore.layers
      .find((l) => l.id === referenceLayerId)
      ?.data as never,
  ) as GeoJSONFeatureCollection;

  // Add a unique id to each feature
  refLayer.features.forEach((f, i) => {
    if (!f.id) f.id = i; // eslint-disable-line no-param-reassign
  });

  // Convert to topojson
  const topology = topojson.topology({ layer: refLayer }, 1e5);

  // Functions to get the id of a pair of features
  const getPairIds = (a: GeoJSONFeature, b: GeoJSONFeature): [string, string] => [`${a.id}__${b.id}`, `${b.id}__${a.id}`];
  const getIds = (a: GeoJSONFeature, b: GeoJSONFeature): [string, string] => [`${a.id}`, `${b.id}`];

  // Compute the discontinuity values between each pair of features
  const resultValue = new Map<string, number>();

  if (discontinuityType === 'relative') {
    topojson.mesh(
      topology,
      topology.objects.layer,
      (a: GeoJSONFeature, b: GeoJSONFeature) => {
        if (a !== b) {
          const valA = a.properties[referenceVariableName];
          const valB = b.properties[referenceVariableName];
          if (!isFiniteNumber(valA) || !isFiniteNumber(valB)) {
            return false;
          }
          const [newId, newIdRev] = getPairIds(a, b);
          if (!(resultValue.get(newId) || resultValue.get(newIdRev))) {
            const value = Mmax(+valA! / +valB!, +valB! / +valA!);
            resultValue.set(newId, value);
          }
        }
        return false;
      },
    );
  } else { // discontinuityType === 'absolute'
    topojson.mesh(
      topology,
      topology.objects.layer,
      (a: GeoJSONFeature, b: GeoJSONFeature) => {
        if (a !== b) {
          const valA = a.properties[referenceVariableName];
          const valB = b.properties[referenceVariableName];
          if (!isFiniteNumber(valA) || !isFiniteNumber(valB)) {
            return false;
          }
          const [newId, newIdRev] = getPairIds(a, b);
          if (!(resultValue.get(newId) || resultValue.get(newIdRev))) {
            const value = Mmax(+valA! - +valB!, +valB! - +valA!);
            resultValue.set(newId, value);
          }
        }
        return false;
      },
    );
  }

  const arrDisc = [];
  const entries = Array.from(resultValue.entries());
  for (let i = 0, n = entries.length; i < n; i += 1) {
    const kv = entries[i];
    if (!Number.isNaN(kv[1])) {
      arrDisc.push(kv);
    }
  }

  const nbFt = arrDisc.length;
  const dRes = [];
  for (let i = 0; i < nbFt; i += 1) {
    const idFt = arrDisc[i][0];
    const [aId, bId] = idFt.split('__');
    const val = arrDisc[i][1];
    const geom = topojson.mesh(
      topology,
      topology.objects.layer,
      (a: GeoJSONFeature, b: GeoJSONFeature) => {
        if (a === b) return false;
        const [refAId, refBId] = getIds(a, b);
        // eslint-disable-next-line no-mixed-operators
        return (refAId === aId && refBId === bId || refAId === bId && refBId === aId);
      },
    );

    // For each feature, we store the discontinuity value
    // and the ids of the two features involved
    dRes.push({
      type: 'Feature',
      geometry: geom,
      properties: {
        'ID-feature1': aId,
        'ID-feature2': bId,
        value: val,
      },
    });
  }

  // Sort (descending) the features by the computed value
  dRes.sort((a, b) => b.properties.value - a.properties.value);

  // Return the result as a GeoJSONFeatureCollection
  return {
    type: 'FeatureCollection',
    features: dRes,
  };
};

export default computeDiscontinuity;
