export {}

declare global {
  interface Window {
    Gdal: any;
  }
  interface FileEntry {
    name: string,
    ext: string,
    file: File,
  }

  type CustomFileList = FileEntry[];

  interface LayerDescription {
    id: number,
    name: string,
    type: string,
    data: GeoJSONFeatureCollection,
    visible: boolean,
  }

  interface GeoJSONFeature {
    type: string,
    geometry: GeoJSONGeometry,
    properties: {},
  }

  interface GeoJSONGeometry {
    type: string,
    coordinates: [],
  }

  interface GeoJSONFeatureCollection {
    type: string,
    features: GeoJSONFeature[],
  }
}
