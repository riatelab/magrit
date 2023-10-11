// declare global {
// import { WebR } from '@r-wasm/webr/webr-main';
import type { Palette } from 'dicopal/dist/index.d';
import type { Dexie } from 'dexie';

declare namespace globalThis {
  let Gdal: typeof Gdal;
  // let Dexie: DexieConstructor;
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
  // ...
  strokeDasharray?: string,
  // The fill color (not used for Choropleth on point / polygon layers nor for linestring layers)
  fillColor?: string,
  // The opacity of the fill (not used for linestring layers)
  fillOpacity?: number,
  // Whether there is a drop shadow or not (we may want to replace the boolean value
  // by an object describing the drop shadow parameters in the future)
  dropShadow: boolean,
  // The radius of the point (not used for linestring / polygon layers)
  pointRadius?: number,
  // Specific parameters for the current renderer (e.g. proportional symbols)
  // Note: we may move away the 'classification' field to use this "rendererParameters" field
  rendererParameters?: (
    ProportionalSymbolsParameters
    | ClassificationParameters
    | ProportionalSymbolsParameters & ClassificationParameters
    | GraticuleParameters
  ),
  // Parameters of the legend associated to the layer
  legend?: ChoroplethLegendParameters,
}

export enum ProportionalSymbolsColorMode {
  singleColor = 'singleColor',
  twoColors = 'twoColors',
  ratioVariable = 'ratioVariable',
  categoricalVariable = 'categoricalVariable',
}

export enum ProportionalSymbolsSymbolType {
  circle = 'circle',
  square = 'square',
  line = 'line',
}

type GeoJSONRecord = { [key in string | number]: unknown };

type GeoJSONPosition = [longitude: number, latitude: number, elevation?: number];

interface GeoJSONGeometryBase extends GeoJSONRecord {
  bbox?: number[];
}

interface Point extends GeoJSONGeometryBase {
  type: 'Point',
  coordinates: GeoJSONPosition,
}

interface MultiPoint extends GeoJSONGeometryBase {
  type: 'MultiPoint',
  coordinates: GeoJSONPosition[],
}

interface LineString extends GeoJSONGeometryBase {
  type: 'LineString',
  coordinates: GeoJSONPosition[],
}

interface MultiLineString extends GeoJSONGeometryBase {
  type: 'MultiLineString',
  coordinates: GeoJSONPosition[][],
}

interface Polygon extends GeoJSONGeometryBase {
  type: 'Polygon',
  coordinates: GeoJSONPosition[][],
}

interface MultiPolygon extends GeoJSONGeometryBase {
  type: 'MultiPolygon',
  coordinates: GeoJSONPosition[][][],
}

interface GeometryCollection extends GeoJSONGeometryBase {
  type: 'GeometryCollection',
  geometries: GeoJSONGeometry[],
}

// A GeoJSON Feature
interface GeoJSONFeature {
  type: string,
  id?: string | number,
  geometry: GeoJSONGeometryType,
  properties: GeoJSONRecord,
}

// GeoJSON Geometry types
type GeoJSONGeometryType = (
  Point
  | MultiPoint
  | LineString
  | MultiLineString
  | Polygon
  | MultiPolygon
  | GeometryCollection
);

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
  quantiles = 'quantiles',
  jenks = 'jenks',
  standardDeviation = 'standardDeviation',
  q6 = 'q6',
  pretty = 'pretty',
  geometricProgression = 'geometricProgression',
  arithmeticProgression = 'arithmeticProgression',
  headTail = 'headTail',
  manual = 'manual',
}

interface CustomPalette {
  // Internal unique identifier of the palette
  id: string,
  // The name of the palette (given by the user)
  name: string,
  // The number of classes of the palette
  number: number,
  // The kind of palette (sequential, diverging, qualitative)
  type: 'sequential' | 'diverging' | 'qualitative',
  // The colors of the palette
  colors: string[],
  // Custom flag (true if the palette was created by the user)
  // This flag is used to distinguish Palette from CustomPalette
  // but we may rely on the type system in the future instead...
  custom: true
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
  palette: Palette | CustomPalette,
  // The color to use for features with no data
  nodataColor: string,
  // Entities by class
  entitiesByClass: number[],
  // Whether to reverse the palette or not
  reversePalette: boolean,
}

export interface ProportionalSymbolsParameters {
  // The name of the variable used to compute the radius of the symbols
  variable: string,
  // The color mode of the proportional symbols
  colorMode: ProportionalSymbolsColorMode,
  // The color to use for the symbols
  color: string | [string, string],
  // The type of symbol to use
  symbolType: ProportionalSymbolsSymbolType,
  // The reference radius size (in pixels)
  referenceRadius: number,
  // The value on which to base the radius of the symbols
  referenceValue: number,
  // The minimum radius size (in pixels)
  // minRadius: number,
  // Whether to avoid overlapping symbols or not
  // (i.e. whether to use a force simulation or not to create
  // a Dorling / Demers like representation)
  avoidOverlapping: boolean,
}

export interface GraticuleParameters {
  step: number,
  extent?: [number, number, number, number],
}

export interface LabelsParameters {
  // The name of the variable used for creating the labels
  variable: string,
  // The font size of the labels
  fontSize: number,
  // The font family of the labels
  fontFamily: string,
  // The font color of the labels
  fontColor: string,
  // The font style of the labels
  fontStyle: string,
  // The font weight of the labels
  fontWeight: string,
  // The text anchor of the labels
  textAnchor: string,
  // The text alignment of the labels
  textAlignment: string,
  // The text offset of the labels
  textOffset: number,
  // The text buffer of the labels
  textBuffer: {
    active: boolean,
    size?: number,
    color?: string,
  }
}

export enum RepresentationType {
  choropleth = 'choropleth',
  proportionalSymbols = 'proportionalSymbols',
  categorical = 'categorical',
  proportionalSymbolsAndCategories = 'proportionalSymbolsAndCategories',
  proportionalSymbolsAndRatio = 'proportionalSymbolsAndRatio',
  sphere = 'sphere',
  graticule = 'graticule',
  labels = 'labels',
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
  // Rectangle behind the legend
  backgroundRect: {
    // Whether to display the rectangle behind the legend
    visible: boolean,
    // The fill color of the rectangle
    fill?: string,
    // The fill opacity of the rectangle
    fillOpacity?: number,
    // The stroke color of the rectangle
    stroke?: string,
  },
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

export enum RenderVisibility {
  RenderAsHidden,
  // RenderAsDisplayNone,
  DoNotRender,
}

export interface ID3Element {
  __data__: GeoJSONFeature,
}

export interface IZoomable {
  __zoom: d3.ZoomTransform,
}

// We have multiple king of legends
// (choropleth, proportional, categorical, ...)
export enum LegendType {
  choropleth = 'choropleth',
  proportional = 'proportional',
  categorical = 'categorical',
  waffle = 'waffle',
}

export enum Orientation {
  horizontal = 'horizontal',
  vertical = 'vertical',
}

export enum ZoomBehavior {
  Redraw,
  Transform,
}

export enum ResizeBehavior {
  ShrinkGrow,
  KeepMapSize,
}
// }
