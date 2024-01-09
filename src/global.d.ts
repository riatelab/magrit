// declare global {
// import { WebR } from '@r-wasm/webr/webr-main';
import type { Gdal } from 'gdal3.js/src/index.d';
import type { Palette } from 'dicopal/dist/index.d';
import type { Dexie } from 'dexie';
import type { Variable } from './helpers/typeDetection';
import type { MapStoreType } from './store/MapStore';

declare namespace globalThis {
  let gdal: Gdal;
  // let Dexie: DexieConstructor;
  // db is an instance of Dexie
  let db: DexieDb;
  // WebR instance
  // let webR: WebR;
  let geos: never;
}

type DexieDb = Dexie
& { projects: Dexie.Table<
{ date: Date, data: {
  layers: LayerDescription[],
  layoutFeatures: LayoutFeature[],
  map: MapStoreType,
  tables: TableDescription[],
} }, number> };

// The description of a layer
// (it contains all the necessary elements to display the layer and its legend if any)
type LayerDescription = {
  // The internal unique identifier of the layer
  id: string,
  // The name of the layer (as displayed in the UI, can be changed by the user)
  name: string,
  // Type of the layer
  type: 'point' | 'linestring' | 'polygon' | 'raster',
  // The type of representation of the layer
  renderer: RepresentationType,
  // The data for the layer
  // (this is either a GeoJSONFeatureCollection or a Sphere, as a special case)
  data: GeoJSONFeatureCollection,
  // Description of the fields of the layer - undefined if no fields
  fields: Variable[] | undefined,
  // Whether the layer is visible or not
  visible: boolean,
  // The color of the stroke (not used for Choropleth on linestring layers)
  strokeColor?: string,
  // The width of the stroke
  strokeWidth?: number,
  // The opacity of the stroke
  strokeOpacity?: number,
  // ...
  strokeDasharray?: string,
  // The fill color (not used for Choropleth on point / polygon layers nor for linestring layers)
  fillColor?: string,
  // The opacity of the fill (not used for linestring layers)
  fillOpacity?: number,
  // The radius of the point (not used for linestring / polygon layers)
  pointRadius?: number,
  // Whether there is a drop shadow or not (we may want to replace the boolean value
  // by an object describing the drop shadow parameters in the future)
  dropShadow: boolean,
  // Whether there is a blur filter or not (we may want to replace the boolean value
  // by an object describing the blur filter parameters in the future)
  blurFilter: boolean,
  // The value for the shape rendering property of the parent SVG group.
  // We use auto by default on all layers of less than 10000 features.
  // For Polygon layers of more than 10000 features, we use optimizeSpeed.
  shapeRendering: ('auto' | 'optimizeSpeed' | 'crispEdges' | 'geometricPrecision'),
  // Specific parameters for the current renderer (e.g. proportional symbols)
  // Note: we may move away the 'classification' field to use this "rendererParameters" field
  rendererParameters?: (
    ProportionalSymbolsParameters
    | ClassificationParameters
    | CategoricalChoroplethParameters
    | ProportionalSymbolsParameters & ClassificationParameters
    | ProportionalSymbolsParameters & CategoricalChoroplethParameters
    | DiscontinuityParameters
    | CartogramParameters
    | GriddedLayerParameters
    | LabelsParameters
    | GraticuleParameters
    | SmoothedLayerParameters
    // | DefaultRendererParameters
  ),
  // Parameters of the legend associated to the layer
  legend?: LegendParameters,
};

type TableDescription = {
  // The internal unique identifier of the table
  id: string,
  // The name of the table (as displayed in the UI, can be changed by the user)
  name: string,
  // Description of the fields of the table
  fields: Variable[],
  // The data for the table (as an array of records)
  data: Record<string, any>[]
};

interface DefaultRendererParameters {
  // The color of the stroke (not used for Choropleth on linestring layers)
  strokeColor?: string,
  // The width of the stroke
  strokeWidth?: number,
  // The opacity of the stroke
  strokeOpacity?: number,
  // ...
  strokeDasharray?: string,
  // The fill color (not used for Choropleth on point / polygon layers nor for linestring layers)
  fillColor?: string,
  // The opacity of the fill (not used for linestring layers)
  fillOpacity?: number,
  // The radius of the point (not used for linestring / polygon layers)
  pointRadius?: number,
}

// type LayerDescriptionDefault = LayerDescription & {
//   renderer: RepresentationType.default,
//   rendererParameters: DefaultRendererParameters
// };

type LayerDescriptionChoropleth = LayerDescription & {
  renderer: RepresentationType.choropleth,
  rendererParameters: ClassificationParameters,
  legend: ChoroplethLegendParameters,
};

type LayerDescriptionProportionalSymbols = LayerDescription & {
  renderer: RepresentationType.proportionalSymbols,
  rendererParameters: ProportionalSymbolsParameters,
  legend: ProportionalSymbolsLegendParameters,
};

type LayerDescriptionLabels = LayerDescription & {
  renderer: RepresentationType.labels,
  rendererParameters: LabelsParameters,
  legend: LabelsLegendParameters,
};

type LayerDescriptionCategoricalChoropleth = LayerDescription & {
  renderer: RepresentationType.categoricalChoropleth,
  rendererParameters: CategoricalChoroplethParameters,
  legend: ChoroplethLegendParameters,
};

type LayerDescriptionDiscontinuity = LayerDescription & {
  renderer: RepresentationType.discontinuity,
  rendererParameters: DiscontinuityParameters,
  legend: DiscontinuityLegendParameters,
};

type LayerDescriptionCartogram = LayerDescription & {
  renderer: RepresentationType.cartogram,
  rendererParameters: CartogramParameters,
  legend: null,
};

type LayerDescriptionGriddedLayer = LayerDescription & {
  renderer: RepresentationType.grid,
  rendererParameters: GriddedLayerParameters,
  legend: ChoroplethLegendParameters,
};

type LayerDescriptionWaffle = LayerDescription & {
  renderer: RepresentationType.waffle,
  rendererParameters: GriddedLayerParameters,
  legend: WaffleLegendParameters,
};

type LayerDescriptionCategoricalPictogram = LayerDescription & {
  renderer: RepresentationType.categoricalPictogram,
  rendererParameters: CategoricalPictogramParameters,
  legend: null,
};

type LayerDescriptionSmoothedLayer = LayerDescription & {
  renderer: RepresentationType.smoothed
  rendererParameters: SmoothedLayerParameters,
  legend: ChoroplethLegendParameters,
};

// export enum ProportionalSymbolsColorMode {
//   singleColor = 'singleColor',
//   twoColors = 'twoColors',
//   ratioVariable = 'ratioVariable',
//   categoricalVariable = 'categoricalVariable',
// }

export enum ProportionalSymbolsSymbolType {
  circle = 'circle',
  square = 'square',
  line = 'line',
}

interface ProjectionDefinition {
  // The type of the projection
  type: 'd3' | 'proj4',
  // The name of the projection (or the key to get the name from i18n)
  name: string,
  // The definition of the projection (string compatible with proj4 or d3 projection name)
  value: string,
  // The bounds of the projection (as ymax, xmin, ymin, xmax)
  // (optional, only used for proj4 projections)
  bounds?: [number, number, number, number],
}

export enum ClassificationMethod {
  equalIntervals = 'equalIntervals',
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
  noDataColor: string,
  // Entities by class
  entitiesByClass: number[],
  // Whether to reverse the palette or not
  reversePalette: boolean,
}

export interface ProportionalSymbolsParameters {
  // The name of the variable used to compute the radius of the symbols
  variable: string,
  // The color to use for the symbols
  color: string,
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
  // The number of iterations of the force simulation
  // (only used if avoidOverlapping is true)
  iterations: number,
  // Whether the symbols can be moved by the user or not
  movable: boolean,
  // The color mode of the proportional symbols
  // colorMode: ProportionalSymbolsColorMode,
}

export interface CategoricalChoroplethParameters {
  // The name of the variable
  variable: string,
  // The mapping between categories and colors,
  // stored as an array of [category, categoryName, color] tuples,
  // one per category.
  mapping: [string | number, string, string][],
  // The color to use for features with no data
  noDataColor: string,
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
  fontStyle: 'normal' | 'italic',
  // The font weight of the labels
  fontWeight: 'normal' | 'bold',
  // The text anchor of the labels
  textAnchor: string,
  // The text alignment of the labels
  textAlignment: string,
  // The text offset of the labels
  textOffset: [number, number],
  // The text buffer of the labels
  textBuffer?: {
    size: number,
    color: string,
  },
  // Whether the labels can be moved by the user or not
  movable: boolean,
  // Stroke to create a halo around the labels
  halo?: {
    color: string,
    width: number,
  },
}

interface DiscontinuityParameters {
  // The name of the variable used
  variable: string,
  // The type of discontinuity
  type: 'absolute' | 'relative',
  // The classification method
  classificationMethod: ClassificationMethod,
  // The number of classes
  classes: number,
  // The break values (computed or manually set)
  breaks: number[],
  // The thickness of the discontinuity, for each class
  sizes: number[],
}

interface CartogramParameters {
  // The name of the variable used to compute the cartogram
  variable: string,
  // The type of cartogram method
  method: CartogramMethod,
  // The number of iterations of the cartogram algorithm (only used for Dougenik for now)
  iterations?: number,
}

interface GriddedLayerParameters {
  // The name of the variable used to compute the gridded layer
  variable: string,
  // The shape of grid cell
  cellType: GridCellShape,
  // The size of the grid cell
  cellSize: number,
}

interface SmoothedLayerParameters {
  // The name of the variable used to compute the smoothed layer
  variable: string,
  // The smoothing method
  method: SmoothingMethod,
  // The smoothing parameters
  smoothingParameters: StewartParameters | KdeParameters,
  // The parameters of the grid used to compute the smoothed layer
  gridParameters: GridParameters,
  // The palette used to color the smoothed layer
  palette: Palette | CustomPalette,
  // The thresholds used to compute the contour of the
  // smoothed layer from the grid
  breaks: number[],
  // Whether to reverse the palette or not
  reversePalette: boolean,
}

interface CategoricalPictogramParameters {
  // The name of the variable used to compute the pictogram
  variable: string,
  // The mapping between categories and icons,
  // stored as an array of [category, categoryName, icon] tuples,
  // one per category.
  mapping: [string | number, string, string][],
}

type AllowChoroplethLegend = Pick<ClassificationParameters, 'variable' | 'palette' | 'breaks' | 'reversePalette' | 'noDataColor'>;

// interface AllowChoroplethLegend {
//   variable: string,
//   // The palette used to color the smoothed layer
//   palette: Palette | CustomPalette,
//   // The thresholds used to compute the contour of the
//   // smoothed layer from the grid
//   breaks: number[],
//   // Whether to reverse the palette or not
//   reversePalette: boolean,
//   // The color to use for features with no data
//   noDataColor: string,
// }

export enum RepresentationType {
  choropleth = 'choropleth',
  proportionalSymbols = 'proportionalSymbols',
  categoricalChoropleth = 'categoricalChoropleth',
  categoricalPictogram = 'categoricalPictogram',
  proportionalSymbolsAndCategories = 'proportionalSymbolsAndCategories',
  proportionalSymbolsAndRatio = 'proportionalSymbolsAndRatio',
  discontinuity = 'discontinuity',
  smoothed = 'smoothed',
  cartogram = 'cartogram',
  grid = 'grid',
  waffle = 'waffle',
  sphere = 'sphere',
  graticule = 'graticule',
  labels = 'labels',
  default = 'default',
}

export enum CartogramMethod {
  Dougenik = 'Dougenik',
  Olson = 'Olson',
  GastnerSeguyMore = 'GastnerSeguyMore',
}

export enum SmoothingMethod {
  Stewart = 'Stewart',
  Kde = 'Kde',
}

export interface KdeParameters {
  bandwidth: number;
  kernel: 'gaussian' | 'epanechnikov' | 'quartic' | 'triangular' | 'uniform';
}

export interface GridParameters {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  resolution: number;
}

interface StewartParameters {
  alpha: number;
  beta: number;
  span: number;
  function: 'gaussian' | 'pareto';
}

export enum GridCellShape {
  square = 'square',
  diamond = 'diamond',
  hexagon = 'hexagon',
  triangle = 'triangle',
}

interface LegendParametersBase {
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
  backgroundRect: BackgroundRect,
}

export interface BackgroundRect {
  // Whether to display the rectangle behind the legend
  visible: boolean,
  // The fill color of the rectangle
  fill?: string,
  // The fill opacity of the rectangle
  fillOpacity?: number,
  // The stroke color of the rectangle
  stroke?: string,
  // The stroke width of the rectangle
  strokeWidth?: number,
  // The stroke opacity of the rectangle
  strokeOpacity?: number,
}

interface LegendTextElement {
  // Actual text to display
  // (optional because LegendTextElement can be used to describe multiple text elements
  // for the labels of the legends)
  text?: string,
  // The font size of the text, in pixels, stored as a number
  fontSize: number,
  // The font family of the text (might include a fallback)
  fontFamily: string,
  // The font color of the text (stored as a string, e.g. '#000000')
  fontColor: string,
  // The font style of the text (e.g. 'italic', or 'normal')
  fontStyle: 'normal' | 'italic',
  // The font weight of the text (e.g. 'bold', or 'normal')
  fontWeight: 'normal' | 'bold',
}

/**
 * The parameters of the legend for choropleth and categorical choropleth maps
 */
interface ChoroplethLegendParameters extends LegendParametersBase {
  type: LegendType.choropleth,
  // Whether the legend is horizontal or vertical
  orientation: Orientation,
  // The width of each box
  boxWidth: number,
  // The height of each box
  boxHeight: number,
  // The (horizontal or vertical, wrt. 'orientation') spacing between boxes
  boxSpacing: number,
  // The (horizontal or vertical, wrt. 'orientation') spacing between the last box
  // and the no-data box if any
  boxSpacingNoData: number,
  // The corner radius of each box (rx and ry of each rect)
  boxCornerRadius: number,
  // The text properties of the labels (and no-data label if any)
  labels: LegendTextElement,
  // The label of the no-data box
  noDataLabel: string,
  // Whether to display the stroke of the boxes
  stroke: boolean,
  // Whether to display a tick between each box
  tick: boolean,
}

/**
 * The parameters of the legend for proportional symbols
 */
interface ProportionalSymbolsLegendParameters extends LegendParametersBase {
  type: LegendType.proportional,
  // Whether the legend is stacked or not
  layout: 'horizontal' | 'vertical' | 'stacked',
  // The values of the symbols in the legend
  // (by default it is the min, the max and two other values,
  // but the user can change it to any value, in order to have only two or three values)
  values: number[],
  // The spacing between the symbols when the legend is not stacked
  // (i.e. when the layout is horizontal or vertical)
  spacing: number,
  // The text properties of the labels
  labels: LegendTextElement,
}

interface LabelsLegendParameters extends LegendParametersBase {
  type: LegendType.labels,
  // The text properties of the labels
  labels: LegendTextElement,
}

interface DiscontinuityLegendParameters extends LegendParametersBase {
  type: LegendType.discontinuity,
  // Whether the legend is horizontal or vertical
  orientation: Orientation,
  // The text properties of the labels
  labels: LegendTextElement,
  // Length of each line in the legend
  // (if the legend is horizontal, the total length of
  // the legend is the sum of the lengths of the lines)
  lineLength: number,
}

interface WaffleLegendParameters extends LegendParametersBase {
  type: LegendType.waffle,
}

export type LegendParameters = (
  ChoroplethLegendParameters
  | ProportionalSymbolsLegendParameters
  | LabelsLegendParameters
  | DiscontinuityLegendParameters
  | WaffleLegendParameters
);

export enum NumberFormatting {
  useSameLocaleAsBrowser = 'useSameLocaleAsBrowser',
  useSameLocaleAsCurrentLanguage = 'useSameLocaleAsCurrentLanguage',
  useCustomLocale = 'useCustomLocale',
}

export interface ID3Element {
  __data__: GeoJSONFeature | { type: 'Sphere' },
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
  discontinuity = 'discontinuity',
  labels = 'labels',
  waffle = 'waffle',
}

export enum Orientation {
  horizontal = 'horizontal',
  vertical = 'vertical',
}

export enum LayoutFeatureType {
  Rectangle,
  Ellipse,
  NorthArrow,
  ScaleBar,
  Line,
  FreeDrawing,
  Text,
}

export enum DistanceUnit {
  m = 'm',
  km = 'km',
  mi = 'mi',
  ft = 'ft',
  yd = 'yd',
}

interface LayoutFeatureBase {
  // The unique identifier of the layout feature
  id: string,
  // The type of the layout feature
  type: LayoutFeatureType,
  // The position of the layout feature
  position: [number, number],
}

export interface Rectangle extends LayoutFeatureBase {
  type: LayoutFeatureType.Rectangle,
  // The width of the rectangle
  width: number,
  // The height of the rectangle
  height: number,
  // The rotation of the rectangle
  rotation: number,
  // The fill color of the rectangle
  fillColor: string,
  // The fill opacity of the rectangle
  fillOpacity: number,
  // The stroke color of the rectangle
  strokeColor: string,
  // The stroke width of the rectangle
  strokeWidth: number,
  // The stroke opacity of the rectangle
  strokeOpacity: number,
  // The corner radius of the rectangle
  cornerRadius: number,
}

export interface Ellipse extends LayoutFeatureBase {
  type: LayoutFeatureType.Ellipse,
  // The x radius of the ellipse
  rx: number,
  // The y radius of the ellipse
  ry: number,
  // The rotation of the ellipse
  rotation: number,
  // The fill color of the rectangle
  fillColor: string,
  // The fill opacity of the rectangle
  fillOpacity: number,
  // The stroke color of the rectangle
  strokeColor: string,
  // The stroke width of the rectangle
  strokeWidth: number,
  // The stroke opacity of the rectangle
  strokeOpacity: number,
}

export interface NorthArrow extends LayoutFeatureBase {
  type: LayoutFeatureType.NorthArrow,
  // The width of the north arrow
  width: number,
  // The height of the north arrow
  height: number,
  // The rotation of the north arrow
  rotation: number,
}

export enum ScaleBarStyle {
  simpleLine = 'simpleLine',
  lineWithTicksOnTop = 'lineWithTicksOnTop',
  lineWithTicksOnBottom = 'lineWithTicksOnBottom',
  blackAndWhiteBar = 'blackAndWhiteBar',
}

export interface ScaleBar extends LayoutFeatureBase {
  type: LayoutFeatureType.ScaleBar,
  // The width of the scale bar
  width: number,
  // The height of the scale bar
  height: number,
  // The rotation of the scale bar
  rotation: number,
  // The unit of the scale bar
  unit: DistanceUnit,
  // The length of the scale bar (in the given unit)
  distance: number,
  // The label of the scale bar (displayed on top of it)
  label?: string,
  // The tick values
  tickValues: number[],
  // The distance between the ticks and the scale bar
  tickPadding: number,
  // The style of the scaleBar
  style: ScaleBarStyle,
}

export interface Line extends LayoutFeatureBase {
  type: LayoutFeatureType.Line,
  // The stroke color of the line
  strokeColor: string,
  // The stroke width of the line
  strokeWidth: number,
  // The stroke opacity of the line
  strokeOpacity: number,
  // The dash array of the line
  strokeDasharray: string | undefined,
  // Whether to display an arrow at the end of the line
  arrow: boolean,
  // The points of the line / arrow
  points: [number, number][],
}

export interface FreeDrawing extends LayoutFeatureBase {
  type: LayoutFeatureType.FreeDrawing,
  // The stroke color of the free drawing
  strokeColor: string,
  // The stroke opacity of the free drawing
  strokeOpacity: number,
  // The stroke width of the free drawing
  strokeWidth: number,
  // The svg path of the free drawing
  path: string,
}

export interface Text extends LayoutFeatureBase {
  type: LayoutFeatureType.Text,
  // The text to display
  text: string,
  // The font size of the text
  fontSize: number,
  // The font family of the text
  fontFamily: string,
  // The font color of the text
  fontColor: string,
  // The font style of the text
  fontStyle: 'normal' | 'italic',
  // The font weight of the text
  fontWeight: 'normal' | 'bold',
  // The text anchor of the text
  textAnchor: 'start' | 'middle' | 'end',
  // The text alignment of the text
  textAlignment: 'left' | 'center' | 'right',
  // Whether to display a rectangle behind the text
  backgroundRect: BackgroundRect,
  // Whether to create a halo around the text
  halo?: {
    color: string,
    width: number,
  },
}

export type LayoutFeature = (
  Rectangle
  | Ellipse
  | NorthArrow
  | ScaleBar
  | Line
  | FreeDrawing
  | Text
);

export type ScoredResult<T> = {
  score: number,
  item: T,
};

export type SearchResults<T> = ScoredResult<T>[];

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

interface DropShadowOptions {
  dx: number,
  dy: number,
  stdDeviation: number,
}

interface BlurOptions {
  stdDeviation: number,
}
