// declare global {
// import { WebR } from '@r-wasm/webr/webr-main';

declare namespace globalThis {
  let Gdal: typeof Gdal;
  let Dexie: DexieConstructor;
  // db is an instance of Dexie
  let db: typeof Dexie;
  // WebR instance
  // let webR: WebR;
}

// A file, dropped by the user
interface FileEntry {
  // The name of the file (without the extension)
  name: string,
  // The extension of the file (e.g. 'csv')
  ext: string,
  // The actual File object
  file: File,
}

// A list of FileEntry, dropped by the user
type CustomFileList = FileEntry[];

// The description of a layer
// (it contains all the necessary elements to display the layer and its legend if any)
interface LayerDescription {
  // The internal unique identifier of the layer
  id: string,
  // The name of the layer (as displayed in the UI, can be changed by the user)
  name: string,
  // Type of the layer
  type: 'point' | 'linestring' | 'polygon' | 'raster' | 'table',
  // The type of representation of the layer
  renderer: RepresentationType,
  // The data for the layer
  data: GeoJSONFeatureCollection,
  // Description of the fields of the layer - undefined if no fields
  fields: Variable[] | undefined,
  // Whether the layer is visible or not
  visible: boolean,
  // The color of the stroke (not used for Choropleth on linestring layers)
  strokeColor?: string,
  // The width of the stroke
  strokeWidth: string,
  // The opacity of the stroke
  strokeOpacity: number,
  // The fill color (not used for Choropleth on point / polygon layers nor for linestring layers)
  fillColor?: string,
  // The opacity of the fill (not used for linestring layers)
  fillOpacity?: number,
  // The radius of the point (not used for linestring / polygon layers)
  pointRadius?: number,
  // Specific parameters for the Choropleth representation
  classification?: ClassificationParameters,
  // Parameters of the legend associated to the layer
  legend?: ChoroplethLegendParameters,
}

// A GeoJSON Feature
interface GeoJSONFeature {
  type: string,
  geometry: GeoJSONGeometry,
  properties: object,
}

// A GeoJSON Geometry
interface GeoJSONGeometry {
  type: string,
  coordinates: [],
}

// A GeoJSON FeatureCollection
interface GeoJSONFeatureCollection {
  type: string,
  features: GeoJSONFeature[],
}

// The supported data types for the fields of a layer
export enum DataType {
  string = 'string',
  number = 'number',
  boolean = 'boolean',
  date = 'date',
}

// The supported ("cartographic") types for the fields of a layer
export enum VariableType {
  identifier = 'identifier',
  ratio = 'ratio',
  stock = 'stock',
  categorical = 'categorical',
  unknown = 'unknown',
}

interface Variable {
  // The name of the described variable
  name: string,
  // Whether the variable has missing values or not
  hasMissingValues: boolean,
  // The type of the variable
  type: VariableType,
  // The data type of the variable
  dataType: DataType,
}

interface ProjectionDefinition {
  // The type of the projection
  type: 'd3' | 'proj4',
  // The name of the projection (or the key to get the name from i18n)
  name: string,
  // The definition of the projection (string compatible with proj4 or d3 projection name)
  value: string,
}

export enum ClassificationMethod {
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
  // The name of the variable classified
  variable: string,
  // The classification method
  method: ClassificationMethod,
  // The number of classes
  classes: number,
  // The break values (computed or manually set)
  breaks: number[],
  // Description of the palette used for the choropleth
  palette: {
    // Palette name
    name: string,
    // Palette provider
    provider: string,
    // Whether the palette is reversed or not
    reversed: boolean,
  };
  // Array describing the color of each feature
  colors: string[],
  // The color to use for features with no data
  nodataColor: string,
}

export enum RepresentationType {
  choropleth = 'choropleth',
  default = 'default',
}

interface LegendParameters {
  // The title of the legend
  title: LegendTextElement,
  // The subtitle of the legend
  subtitle?: LegendTextElement,
  // The (bottom) note of the legend
  note?: LegendTextElement,
  // The type of legend among the available ones
  type: LegendType,
  // Position of the legend on the SVG element
  position: [number, number],
  // Whether to display the legend
  visible: boolean,
  // Whether to round the values displayed in the legend
  roundDecimals: number | null,
}

interface LegendTextElement {
  // Actual text to display
  // (optional because LegendTextElement can be used to describe multiple text elements
  // for the labels of the legends)
  text?: string,
  // The font size of the text (stored as a string, e.g. '12px')
  fontSize: string,
  // The font family of the text (might include a fallback)
  fontFamily: string,
  // The font color of the text (stored as a string, e.g. '#000000')
  fontColor: string,
  // The font style of the text (e.g. 'italic', or 'normal')
  fontStyle: string,
  // The font weight of the text (e.g. 'bold', or 'normal')
  fontWeight: string,
}

interface ChoroplethLegendParameters extends LegendParameters {
  // Whether the legend is horizontal or vertical
  orientation: Orientation,
  // The width of each box
  boxWidth: number,
  // The height of each box
  boxHeight: number,
  // The (horizontal or vertical,  wrt. 'orientation') spacing between boxes
  boxSpacing: number,
  // The corner radius of each box (rx and ry of each rect)
  boxCornerRadius: number,
  // The text properties of the labels
  labels: LegendTextElement,
}

export enum LegendType {
  choropleth = 'choropleth',
  proportional = 'proportional',
  categorical = 'categorical',
}

export enum Orientation {
  horizontal = 'horizontal',
  vertical = 'vertical',
}
// }
