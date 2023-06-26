// declare global {
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
  id: string,
  name: string,
  type: 'point' | 'linestring' | 'polygon' | 'raster' | 'table',
  renderer: string,
  data: GeoJSONFeatureCollection,
  fields: Variable[],
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

export enum DataTypes {
  string = 'string',
  number = 'number',
  boolean = 'boolean',
  date = 'date',
}

export enum VariableTypes {
  identifier = 'identifier',
  ratio = 'ratio',
  stock = 'stock',
  categorical = 'categorical',
  unknown = 'unknown',
}

interface Variable {
  name: string,
  hasMissingValues: boolean,
  type: VariableTypes,
  dataType: DataTypes,
}
// }
