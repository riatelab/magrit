export {};

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
    strokeColor: string,
    strokeWidth: string,
    strokeOpacity: number,
    fillColor: string,
    fillOpacity: number,
    pointRadius: number | undefined,
  }

  interface GeoJSONFeature {
    type: string,
    geometry: GeoJSONGeometry,
    properties: object,
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
