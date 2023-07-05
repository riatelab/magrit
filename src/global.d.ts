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
  renderer: RepresentationTypes,
  data: GeoJSONFeatureCollection,
  fields: Variable[] | undefined,
  visible: boolean,
  strokeColor: string,
  strokeWidth: string,
  strokeOpacity: number,
  fillColor: string,
  fillOpacity: number,
  pointRadius: number | undefined,
  // For choropleth:
  classification: ClassificationParameters | undefined,
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

interface ProjectionDefinition {
  type: string,
  name: string,
  value: string,
}

export enum ClassificationMethods {
  equalInterval = 'equalInterval',
  quantile = 'quantile',
  jenks = 'jenks',
  standardDeviation = 'standardDeviation',
  q6 = 'q6',
  pretty = 'pretty',
  geometricProgression = 'geometricProgression',
  arithmeticProgression = 'arithmeticProgression',
  headTail = 'headTail',
  manual = 'manual',
}

interface ClassificationParameters {
  variable: string,
  method: ClassificationMethods,
  classes: number,
  breaks: number[],
  palette: {
    name: string,
    provider: string,
  };
  colors: string[],
  nodataColor: string,
}
// }

export enum RepresentationTypes {
  choropleth = 'choropleth',
  default = 'default',
}
