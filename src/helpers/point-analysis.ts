// Imports from third-party libraries
import RBush, { type BBox } from 'rbush';
import { type AllGeoJSON, bbox, booleanIntersects } from '@turf/turf';

// Helpers
import d3 from './d3-custom';
import { isNumber } from './common';
import { gridFunctions, transformResolution } from './grid-creation';
import {
  getProjection, getProjectionUnit, reprojWithD3, reprojWithProj4,
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
  toBBox([x, y, ix]: [number, number]) {
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
      .map((f, ix) => [...f.geometry.coordinates, ix]),
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

const pointAnalysisDensity = (
  pointLayer: GeoJSONFeatureCollection,
  maskLayer: GeoJSONFeatureCollection,
): GeoJSONFeatureCollection => {
  // Compute count by feature
  const layer = pointAnalysisCount(pointLayer, maskLayer);
  // Compute area by feature
  // ...
};

const pointAnalysisWeightedCount = (
  pointLayer: GeoJSONFeatureCollection,
  maskLayer: GeoJSONFeatureCollection,
  variable: string,
): GeoJSONFeatureCollection => {
  const tree = new RbushPoint();
  tree.load(
    pointLayer.features
      .map((f, ix) => [...f.geometry.coordinates, ix]),
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

const pointAnalysisWeightedDensity = (
  pointLayer: GeoJSONFeatureCollection,
  maskLayer: GeoJSONFeatureCollection,
  variable: string,
): GeoJSONFeatureCollection => {
  // Compute weighted count by feature
  const layer = pointAnalysisWeightedCount(pointLayer, maskLayer, variable);
  // Compute area by feature
  // ...
};

const pointAnalysisMean = (
  pointLayer: GeoJSONFeatureCollection,
  maskLayer: GeoJSONFeatureCollection,
  variable: string,
): GeoJSONFeatureCollection => {
  console.log('...');
  return {};
};

const pointAnalysisStandardDeviation = (
  pointLayer: GeoJSONFeatureCollection,
  maskLayer: GeoJSONFeatureCollection,
  variable: string,
): GeoJSONFeatureCollection => {
  console.log('...');
  return {};
};

export const pointAnalysisOnLayer = (
  pointLayer: GeoJSONFeatureCollection,
  maskLayer: GeoJSONFeatureCollection,
  analysisType: PointAnalysisRatioType | PointAnalysisStockType,
  targetVariable: string,
): GeoJSONFeatureCollection => {
  if (analysisType === PointAnalysisStockType.Count) {
    return pointAnalysisCount(pointLayer, maskLayer);
  }
  if (analysisType === PointAnalysisStockType.WeightedCount) {
    return pointAnalysisWeightedCount(pointLayer, maskLayer, targetVariable);
  }
  if (analysisType === PointAnalysisRatioType.Density) {
    return pointAnalysisDensity(pointLayer, maskLayer);
  }
  if (analysisType === PointAnalysisRatioType.WeightedDensity) {
    return pointAnalysisWeightedDensity(pointLayer, maskLayer, targetVariable);
  }
  if (analysisType === PointAnalysisRatioType.Mean) {
    return pointAnalysisMean(pointLayer, maskLayer, targetVariable);
  }
  if (analysisType === PointAnalysisRatioType.StandardDeviation) {
    return pointAnalysisStandardDeviation(pointLayer, maskLayer, targetVariable);
  }
  throw new Error('Unreachable code');
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
    resultLayer = pointAnalysisDensity(pointLayer, gridLayer);
  }
  if (analysisType === PointAnalysisRatioType.WeightedDensity) {
    resultLayer = pointAnalysisWeightedDensity(pointLayer, gridLayer, targetVariable);
  }
  if (analysisType === PointAnalysisRatioType.Mean) {
    resultLayer = pointAnalysisMean(pointLayer, gridLayer, targetVariable);
  }
  if (analysisType === PointAnalysisRatioType.StandardDeviation) {
    resultLayer = pointAnalysisStandardDeviation(pointLayer, gridLayer, targetVariable);
  }

  return isGeo
    ? rewindLayer(resultLayer)
    : rewindLayer(reprojFunc(proj, resultLayer, true));
};
