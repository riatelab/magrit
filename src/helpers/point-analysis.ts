// Imports from third-party libraries
import RBush, { type BBox } from 'rbush';
import {
  type AllGeoJSON,
  area,
  bbox,
  booleanIntersects,
} from '@turf/turf';

// Helpers
import d3 from './d3-custom';
import { isNumber } from './common';
import { gridFunctions, transformResolution } from './grid-creation';
import {
  getProjection,
  getProjectionUnit,
  reprojWithD3,
  reprojWithProj4,
} from './projection';
import rewindLayer from './rewind';

// Stores
import { mapStore } from '../store/MapStore';

// Types / Interfaces / Enums
import {
  GeoJSONFeatureCollection,
  GridCellShape,
  GridParameters,
  PointAnalysisRatioType,
  PointAnalysisStockType,
} from '../global.d';

type CustomPoint = { x: number, y: number, ix: number };

class RbushPoint extends RBush<CustomPoint> {
  // eslint-disable-next-line class-methods-use-this
  toBBox([x, y, ix]: [number, number, number]) {
    return {
      minX: x, minY: y, maxX: x, maxY: y, ix,
    } as BBox;
  }

  // eslint-disable-next-line class-methods-use-this
  compareMinX(a: CustomPoint, b: CustomPoint) { return a.x - b.x; }

  // eslint-disable-next-line class-methods-use-this
  compareMinY(a: CustomPoint, b: CustomPoint) { return a.y - b.y; }
}

const pointAnalysisCount = (
  pointLayer: GeoJSONFeatureCollection,
  maskLayer: GeoJSONFeatureCollection,
): GeoJSONFeatureCollection => {
  const tree = new RbushPoint();
  tree.load(
    pointLayer.features
      .map((f, ix) => [...f.geometry.coordinates, ix]) as never[],
  );

  const resultingFeatures = maskLayer.features.map((maskFeature) => {
    const box = bbox(maskFeature) as [number, number, number, number];
    const treeMatches = tree.search({
      minX: box[0],
      minY: box[1],
      maxX: box[2],
      maxY: box[3],
    });
    let count = 0;
    for (let i = 0; i < treeMatches.length; i += 1) {
      const ftTree = treeMatches[i];
      const indexPt = ftTree[2];
      const pt = pointLayer.features[indexPt];
      if (booleanIntersects(maskFeature.geometry, pt.geometry)) {
        count += 1;
      }
    }
    return {
      type: 'Feature',
      geometry: maskFeature.geometry,
      properties: {
        ...maskFeature.properties,
        Count: count,
      },
    };
  });

  return {
    type: 'FeatureCollection',
    features: resultingFeatures,
  } as GeoJSONFeatureCollection;
};

const pointAnalysisWeightedCount = (
  pointLayer: GeoJSONFeatureCollection,
  maskLayer: GeoJSONFeatureCollection,
  variable: string,
): GeoJSONFeatureCollection => {
  const tree = new RbushPoint();
  tree.load(
    pointLayer.features
      .map((f, ix) => [...f.geometry.coordinates, ix]) as never[],
  );

  const resultingFeatures = maskLayer.features.map((maskFeature) => {
    const box = bbox(maskFeature) as [number, number, number, number];
    const treeMatches = tree.search({
      minX: box[0],
      minY: box[1],
      maxX: box[2],
      maxY: box[3],
    });
    let count = 0;
    for (let i = 0; i < treeMatches.length; i += 1) {
      const ftTree = treeMatches[i];
      const indexPt = ftTree[2];
      const pt = pointLayer.features[indexPt];

      const variableValue = isNumber(pt.properties[variable])
        ? +pt.properties[variable]
        : 0;

      if (booleanIntersects(maskFeature.geometry, pt.geometry)) {
        count += variableValue;
      }
    }
    return {
      type: 'Feature',
      geometry: maskFeature.geometry,
      properties: {
        ...maskFeature.properties,
        WeightedCount: count,
      },
    };
  });

  return {
    type: 'FeatureCollection',
    features: resultingFeatures,
  } as GeoJSONFeatureCollection;
};

const pointAnalysisMean = (
  pointLayer: GeoJSONFeatureCollection,
  maskLayer: GeoJSONFeatureCollection,
  variable: string,
): GeoJSONFeatureCollection => {
  const tree = new RbushPoint();
  tree.load(
    pointLayer.features
      .map((f, ix) => [...f.geometry.coordinates, ix]) as never[],
  );

  const resultingFeatures = maskLayer.features.map((maskFeature) => {
    const box = bbox(maskFeature) as [number, number, number, number];
    const treeMatches = tree.search({
      minX: box[0],
      minY: box[1],
      maxX: box[2],
      maxY: box[3],
    });
    let count = 0;
    let sum = 0;
    for (let i = 0; i < treeMatches.length; i += 1) {
      const ftTree = treeMatches[i];
      const indexPt = ftTree[2];
      const pt = pointLayer.features[indexPt];

      const variableValue = isNumber(pt.properties[variable])
        ? +pt.properties[variable]
        : 0;

      if (booleanIntersects(maskFeature.geometry, pt.geometry)) {
        count += 1;
        sum += variableValue;
      }
    }
    return {
      type: 'Feature',
      geometry: maskFeature.geometry,
      properties: {
        ...maskFeature.properties,
        Mean: count === 0 ? 0 : sum / count,
      },
    };
  });

  return {
    type: 'FeatureCollection',
    features: resultingFeatures,
  } as GeoJSONFeatureCollection;
};

const pointAnalysisStandardDeviation = (
  pointLayer: GeoJSONFeatureCollection,
  maskLayer: GeoJSONFeatureCollection,
  variable: string,
): GeoJSONFeatureCollection => {
  const tree = new RbushPoint();
  tree.load(
    pointLayer.features
      .map((f, ix) => [...f.geometry.coordinates, ix]) as never[],
  );

  const resultingFeatures = maskLayer.features.map((maskFeature) => {
    const box = bbox(maskFeature) as [number, number, number, number];
    const treeMatches = tree.search({
      minX: box[0],
      minY: box[1],
      maxX: box[2],
      maxY: box[3],
    });
    let count = 0;
    let sum = 0;
    let sum2 = 0;
    for (let i = 0; i < treeMatches.length; i += 1) {
      const ftTree = treeMatches[i];
      const indexPt = ftTree[2];
      const pt = pointLayer.features[indexPt];

      const variableValue = isNumber(pt.properties[variable])
        ? +pt.properties[variable]
        : 0;

      if (booleanIntersects(maskFeature.geometry, pt.geometry)) {
        count += 1;
        sum += variableValue;
        sum2 += variableValue ** 2;
      }
    }
    return {
      type: 'Feature',
      geometry: maskFeature.geometry,
      properties: {
        ...maskFeature.properties,
        StandardDeviation: count === 0 ? 0 : Math.sqrt(sum2 / count - (sum / count) ** 2),
      },
    };
  });

  return {
    type: 'FeatureCollection',
    features: resultingFeatures,
  } as GeoJSONFeatureCollection;
};

const applyDensity = (
  layer: GeoJSONFeatureCollection,
  analysisType: PointAnalysisRatioType,
): GeoJSONFeatureCollection => {
  const varNameCount = analysisType === PointAnalysisRatioType.Density
    ? 'Count'
    : 'WeightedCount';
  layer.features.forEach((ft) => {
    const areaFt = area(ft.geometry as AllGeoJSON) / 1000000;
    const c = ft.properties[varNameCount] as number;
    // eslint-disable-next-line no-param-reassign
    ft.properties[analysisType] = c / areaFt;
  });

  return layer;
};

export const pointAnalysisOnLayer = (
  pointLayer: GeoJSONFeatureCollection,
  maskLayer: GeoJSONFeatureCollection,
  analysisType: PointAnalysisRatioType | PointAnalysisStockType,
  targetVariable: string,
): GeoJSONFeatureCollection => {
  let resultLayer;

  if (analysisType === PointAnalysisStockType.Count) {
    resultLayer = pointAnalysisCount(pointLayer, maskLayer);
  } else if (analysisType === PointAnalysisStockType.WeightedCount) {
    resultLayer = pointAnalysisWeightedCount(pointLayer, maskLayer, targetVariable);
  } else if (analysisType === PointAnalysisRatioType.Density) {
    // We treat density as a count for now
    // and will compute the count/area later
    resultLayer = pointAnalysisCount(pointLayer, maskLayer);
  } else if (analysisType === PointAnalysisRatioType.WeightedDensity) {
    // We treat weighted density as a weighted count for now
    // and will compute the count/area later
    resultLayer = pointAnalysisWeightedCount(pointLayer, maskLayer, targetVariable);
  } else if (analysisType === PointAnalysisRatioType.Mean) {
    resultLayer = pointAnalysisMean(pointLayer, maskLayer, targetVariable);
  } else if (analysisType === PointAnalysisRatioType.StandardDeviation) {
    resultLayer = pointAnalysisStandardDeviation(pointLayer, maskLayer, targetVariable);
  } else {
    throw new Error('Unreachable code');
  }

  if (
    analysisType === PointAnalysisRatioType.Density
    || analysisType === PointAnalysisRatioType.WeightedDensity
  ) {
    resultLayer = applyDensity(resultLayer, analysisType);
  }

  return resultLayer;
};

export const pointAnalysisOnGrid = (
  pointLayer: GeoJSONFeatureCollection,
  gridParameters: GridParameters & { cellType: GridCellShape },
  analysisType: PointAnalysisRatioType | PointAnalysisStockType,
  targetVariable: string,
): GeoJSONFeatureCollection => {
  let reprojFunc;
  let proj;
  let isGeo;
  if (mapStore.projection.type === 'd3') {
    isGeo = true;
    proj = d3[mapStore.projection.value]()
      .center([0, 0])
      .translate([0, 0])
      .scale(1);
    reprojFunc = reprojWithD3;
  } else { // mapStore.projection.type === 'proj4'
    const t = getProjectionUnit(mapStore.projection);
    isGeo = t.isGeo;
    proj = getProjection(mapStore.projection.value);
    reprojFunc = reprojWithProj4;
  }

  const resolution = transformResolution(
    gridParameters.resolution,
    gridParameters.cellType,
    // isGeo,
  );

  // If data is geo we keep it in WGS84, otherwise we reproject it to the current map projection
  const projectedData = isGeo ? pointLayer : reprojFunc(proj, pointLayer);

  // We want to compute the bounding box of the data (in the current map projection if it's not geo)
  const extent = bbox(projectedData as AllGeoJSON) as [number, number, number, number];

  // Generate the grid with the appropriate shape
  const gridLayer = gridFunctions[gridParameters.cellType](extent, resolution);

  let resultLayer;
  if (analysisType === PointAnalysisStockType.Count) {
    resultLayer = pointAnalysisCount(pointLayer, gridLayer);
  }
  if (analysisType === PointAnalysisStockType.WeightedCount) {
    resultLayer = pointAnalysisWeightedCount(pointLayer, gridLayer, targetVariable);
  }
  if (analysisType === PointAnalysisRatioType.Density) {
    // We treat density as a count for now
    // and will compute the count/area later
    resultLayer = pointAnalysisCount(pointLayer, gridLayer);
  }
  if (analysisType === PointAnalysisRatioType.WeightedDensity) {
    // We treat weighted density as a weighted count for now
    // and will compute the count/area later
    resultLayer = pointAnalysisWeightedCount(pointLayer, gridLayer, targetVariable);
  }
  if (analysisType === PointAnalysisRatioType.Mean) {
    resultLayer = pointAnalysisMean(pointLayer, gridLayer, targetVariable);
  }
  if (analysisType === PointAnalysisRatioType.StandardDeviation) {
    resultLayer = pointAnalysisStandardDeviation(pointLayer, gridLayer, targetVariable);
  }

  let resultGeoLayer = isGeo
    ? rewindLayer(resultLayer)
    : rewindLayer(reprojFunc(proj, resultLayer, true));

  if (
    analysisType === PointAnalysisRatioType.Density
    || analysisType === PointAnalysisRatioType.WeightedDensity
  ) {
    resultGeoLayer = applyDensity(resultGeoLayer, analysisType);
  }

  return resultGeoLayer;
};
