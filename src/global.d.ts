// declare global {
// import { WebR } from '@r-wasm/webr/webr-main';
import type { Gdal } from 'gdal3.js/src/index.d';
import type { Dexie } from 'dexie';
import type { Variable } from './helpers/typeDetection';
import type { MapStoreType } from './store/MapStore';
import type { LinearRegressionResult } from './helpers/statistics';
import type { ApplicationSettingsStoreType } from './store/ApplicationSettingsStore';

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
  version: string,
  applicationSettings: ApplicationSettingsStoreType,
  layers: LayerDescription[],
  layoutFeaturesAndLegends: (LayoutFeature | Legend)[],
  map: MapStoreType,
  tables: TableDescription[],
} }, number> };

type VectorType = 'point' | 'linestring' | 'polygon';

// The description of a layer
// (it contains all the necessary elements to display the layer and its legend if any)
type LayerDescription = {
  // The internal unique identifier of the layer
  id: string,
  // The name of the layer (as displayed in the UI, can be changed by the user)
  name: string,
  // Type of the layer
  type: VectorType | 'raster',
  // The type of representation of the layer
  representationType: RepresentationType,
  // The data for the layer
  // (this is either a GeoJSONFeatureCollection or a Sphere, as a special case)
  data: GeoJSONFeatureCollection,
  // Description of the fields of the layer - undefined if no fields
  fields: Variable[],
  // Whether the layer is visible or not
  visible: boolean,
  // The color of the stroke (not used for Choropleth on linestring layers)
  strokeColor?: string,
  // The width of the stroke
  strokeWidth?: number,
  // The opacity of the stroke
  strokeOpacity?: number,
  // The dash array value of the stroke
  strokeDasharray?: string,
  // The fill color (not used for Choropleth on point / polygon layers nor for linestring layers)
  fillColor?: string,
  // The opacity of the fill (not used for linestring layers)
  fillOpacity?: number,
  // The size of the point symbol (not used for linestring / polygon layers)
  symbolSize?: number,
  // The type of symbol (not used for linestring / polygon layers)
  symbolType?: SymbolType,
  // Whether there is a drop shadow or not (we may want to replace the boolean value
  // by an object describing the drop shadow parameters in the future)
  dropShadow: DropShadowOptions | null,
  // The value for the shape rendering property of the parent SVG group.
  // We use auto by default on all layers of less than 10000 features.
  // For Polygon layers of more than 10000 features, we use optimizeSpeed.
  shapeRendering: ('auto' | 'optimizeSpeed' | 'crispEdges' | 'geometricPrecision'),
  // Specific parameters for the current renderer (e.g. proportional symbols)
  rendererParameters?: (
    ProportionalSymbolsParameters
    | ClassificationParameters
    | CategoricalChoroplethParameters
    | DiscontinuityParameters
    | LabelsParameters
    | GraticuleParameters
    | LinksParameters
    | MushroomsParameters
    | CategoricalPictogramParameters
    | WaffleParameters
    // | DefaultRendererParameters
  ),
  layerCreationOptions?: (
    CartogramParameters
    | GriddedLayerParameters
    | SmoothedLayerParameters
    | LinearRegressionResult
  ),
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
  // The dash array value of the stroke
  strokeDasharray?: string,
  // The fill color (not used for Choropleth on point / polygon layers nor for linestring layers)
  fillColor?: string,
  // The opacity of the fill (not used for linestring layers)
  fillOpacity?: number,
  // The size of the point symbol (not used for linestring / polygon layers)
  symbolSize?: number,
  // The type of symbol
  symbolType?: SymbolType,
}

interface DefaultPointRendererParameters {
  // The color of the stroke
  strokeColor: string,
  // The width of the stroke
  strokeWidth: number,
  // The opacity of the stroke
  strokeOpacity: number,
  // The dash array value of the stroke
  strokeDasharray: string,
  // The fill color
  fillColor: string,
  // The opacity of the fill
  fillOpacity: number,
  // The size of the point symbol
  symbolSize: number,
  // The type of symbol
  symbolType: SymbolType,
}

interface DefaultLineRendererParameters {
  // The color of the stroke
  strokeColor: string,
  // The width of the stroke
  strokeWidth: number,
  // The opacity of the stroke
  strokeOpacity: number,
  // The dash array value of the stroke
  strokeDasharray: string,
}

interface DefaultPolygonRendererParameters {
  // The color of the stroke
  strokeColor: string,
  // The width of the stroke
  strokeWidth: number,
  // The opacity of the stroke
  strokeOpacity: number,
  // The dash array value of the stroke
  strokeDasharray: string,
  // The fill color
  fillColor: string,
  // The opacity of the fill
  fillOpacity: number,
}
// type LayerDescriptionDefault = LayerDescription & {
//   representationType: RepresentationType.default,
//   rendererParameters: DefaultRendererParameters
// };

type LayerDescriptionChoropleth = LayerDescription & {
  representationType: RepresentationType.choropleth,
  rendererParameters: ClassificationParameters,
};

type LayerDescriptionProportionalSymbols = LayerDescription & {
  type: 'point',
  representationType: RepresentationType.proportionalSymbols,
  rendererParameters: ProportionalSymbolsParameters,
};

type LayerDescriptionLabels = LayerDescription & {
  type: 'point'
  representationType: RepresentationType.labels,
  rendererParameters: LabelsParameters,
};

type LayerDescriptionCategoricalChoropleth = LayerDescription & {
  representationType: RepresentationType.categoricalChoropleth,
  rendererParameters: CategoricalChoroplethParameters,
};

type LayerDescriptionDiscontinuity = LayerDescription & {
  representationType: RepresentationType.discontinuity,
  rendererParameters: DiscontinuityParameters,
};

type LayerDescriptionCartogram = LayerDescription & {
  representationType: RepresentationType.cartogram,
  rendererParameters: undefined,
  layerCreationOptions: CartogramParameters,
};

type LayerDescriptionGriddedLayer = LayerDescription & {
  representationType: RepresentationType.grid,
  rendererParameters: ClassificationParameters,
  layerCreationOptions: GriddedLayerParameters,
};

type LayerDescriptionLinks = LayerDescription & {
  representationType: RepresentationType.links,
  rendererParameters: LinksParameters,
};

type LayerDescriptionSmoothedLayer = LayerDescription & {
  representationType: RepresentationType.smoothed
  rendererParameters: ClassificationParameters,
  layerCreationOptions: SmoothedLayerParameters,
};

type LayerDescriptionMushroomLayer = LayerDescription & {
  representationType: RepresentationType.mushrooms,
  rendererParameters: MushroomsParameters,
};

type LayerDescriptionWaffle = LayerDescription & {
  representationType: RepresentationType.waffle,
  rendererParameters: WaffleParameters,
};

type LayerDescriptionCategoricalPictogram = LayerDescription & {
  representationType: RepresentationType.categoricalPictogram,
  rendererParameters: CategoricalPictogramParameters,
};

type LayerDescriptionLMResultStock = LayerDescriptionProportionalSymbols & {
  layerCreationOptions: LinearRegressionResult,
};

type LayerDescriptionLMResultRatio = LayerDescriptionChoropleth & {
  layerCreationOptions: LinearRegressionResult,
};

type LayerDescriptionPointAggResultStock = LayerDescriptionProportionalSymbols & {
  layerCreationOptions: unknown, // TODO
};

type LayerDescriptionPointAggResultRatio = LayerDescriptionChoropleth & {
  layerCreationOptions: unknown, // TODO
};

type SymbolType = 'circle' | 'square' | 'diamond' | 'diamond2' | 'cross' | 'triangle' | 'star';

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
  // The definition of the projection.
  // We allow proj4 string, WKT1 string, or a d3 projection name.
  value: string,
  // The bounds of the projection (as ymax, xmin, ymin, xmax)
  // (optional, only used for proj4 projections)
  bounds?: [number, number, number, number],
  // The code of the projection (optional, only used for proj4 projections that
  // were created from an EPSG code)
  code?: string,
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
  nestedMeans = 'nestedMeans',
  ckmeans = 'ckmeans',
  manual = 'manual',
}

interface CustomPalette {
  // The id of the palette (this is either the id in dicopal
  // or a unique id generated by the application)
  id: string,
  // The name of the palette
  name: string,
  // The number of classes of the palette
  number: number,
  // The kind of palette (sequential, diverging, qualitative)
  type: 'sequential' | 'diverging' | 'qualitative' | 'custom'
  // The colors of the palette
  colors: string[],
  // The provenance of the palette
  provenance: 'dicopal' | 'user',
  // Is the palette reversed?
  reversed: boolean,
  // The provider of the palette (only if it comes from dicopal)
  // provider?: Provider,
  // Options for diverging palettes that comes from dicopal
  divergingOptions?: {
    left: number,
    right: number,
    centralClass: boolean,
    balanced: boolean,
    // customCentralClass?: string,
  }
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
  palette: CustomPalette,
  // The color to use for features with no data
  noDataColor: string,
  // Entities by class
  entitiesByClass: number[],
  // The mean position role (for mean-stddev classification only)
  meanPositionRole?: 'center' | 'boundary',
  // The amount of standard deviations to use (for mean-stddev classification)
  amplitude?: number,
}

export enum ProportionalSymbolsColorMode {
  // All the symbols have the same color
  singleColor = 'singleColor',
  // The symbols are colored based on a ratio variable
  // (this is our proposed solution for the "proportional symbols and ratio" representation)
  ratioVariable = 'ratioVariable',
  // The symbols are colored based on a categorical variable
  // (this is our proposed solution for the "proportional symbols and categories" representation)
  categoricalVariable = 'categoricalVariable',
  // The symbols are colored differently based on the sign of the variable
  positiveNegative = 'positiveNegative',
}

export interface ProportionalSymbolsParametersBase {
  // The name of the variable used to compute the radius of the symbols
  variable: string,
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
  colorMode: ProportionalSymbolsColorMode,
}

type ProportionalSymbolSingleColorParameters = ProportionalSymbolsParametersBase & {
  colorMode: ProportionalSymbolsColorMode.singleColor,
  color: string,
};

type ProportionalSymbolsRatioParameters = ProportionalSymbolsParametersBase & {
  colorMode: ProportionalSymbolsColorMode.ratioVariable,
  color: ClassificationParameters,
};

type ProportionalSymbolCategoryParameters = ProportionalSymbolsParametersBase & {
  colorMode: ProportionalSymbolsColorMode.categoricalVariable,
  color: CategoricalChoroplethParameters,
};

type ProportionalSymbolsPositiveNegativeParameters = ProportionalSymbolsParametersBase & {
  colorMode: ProportionalSymbolsColorMode.positiveNegative,
  color: [string, string],
};

type ProportionalSymbolsParameters =
ProportionalSymbolSingleColorParameters
| ProportionalSymbolsRatioParameters
| ProportionalSymbolCategoryParameters
| ProportionalSymbolsPositiveNegativeParameters;

export interface HalfProportionalMarkParameters {
  variable: string,
  color: string,
  symbolType: ProportionalSymbolsSymbolType.circle | ProportionalSymbolsSymbolType.square,
  referenceSize: number,
  referenceValue: number,
}

export interface MushroomsParameters {
  // The properties for the upper part of the mushroom
  top: HalfProportionalMarkParameters,
  // The properties for the lower part of the mushroom
  bottom: HalfProportionalMarkParameters,
  // Whether the mushroom can be moved by the user or not
  movable: boolean,
}

export interface CategoricalChoroplethParameters {
  // The name of the variable
  variable: string,
  // The mapping between categories and colors,
  // stored as an array of
  // [category, categoryName, color, number of values] tuples,
  // one per category.
  mapping: CategoricalChoroplethMapping[],
  // The color to use for features with no data
  noDataColor: string,
}

export interface CategoricalChoroplethMapping {
  value: string | number | null,
  categoryName: string | null,
  color: string,
  count: number,
}

export interface GraticuleParameters {
  step: [number, number],
  extent?: [number, number, number, number],
}

export interface SingleLabelParameters {
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
  textAnchor: 'start' | 'middle' | 'end',
  // The text alignment of the labels
  textAlignment: string,
  // The text offset of the labels
  textOffset: [number, number],
  // Stroke to create a halo around the labels
  halo?: {
    color: string,
    width: number,
  },
}

export interface LabelsParameters {
  // The name of the variable used for creating the labels
  variable: string,
  // Whether the labels can be moved by the user or not
  movable: boolean,
  // The default parameters for the labels
  default: SingleLabelParameters,
  // Specific parameters per feature
  specific: {
    [featureId: number]: SingleLabelParameters & { text: string },
  },
  // Parameters for proportional labels
  proportional?: {
    variable: string,
    referenceSize: number,
    referenceValue: number,
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
  // The parameters of the grid used to compute the gridded layer
  // (bbox and resolution)
  gridParameters: GridParameters,
  // Whether the grid is created on the plane of the map
  // or in the current projection
  gridCreation: 'plane' | 'projection',
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
  // The (optional) divisor variable used to compute the smoothed layer
  divisorVariable?: string,
}

interface WaffleParameters {
  // The variable we want to represent with the waffle
  // (the order is important, because symbols are drawn in the reverse order of the variables)
  variables: { name: string, displayName: string, color: string }[],
  // The type of symbol used to represent the waffles
  symbolType: ProportionalSymbolsSymbolType.circle | ProportionalSymbolsSymbolType.square,
  // The size for each symbol
  size: number,
  // The number of columns for the waffle
  columns: number,
  // How much stock is represented by each symbol
  symbolValue: number,
  // How much space between each symbol
  spacing: number,
  // Whether the waffles can be moved by the user or not
  movable: boolean,
}

interface CategoricalPictogramMapping {
  // The value of the variable
  value: string | number | null,
  // The corresponding category name (might be edited by the user)
  categoryName: string | null,
  // The image content (either the base64 content of the PNG or the SVG content)
  iconContent: string,
  // The type of image
  iconType: ImageType,
  // The dimension of the image
  iconDimension: [number, number],
  // The number of values for this category
  count: number,
}

interface CategoricalPictogramParameters {
  // The name of the variable used to compute the pictogram
  variable: string,
  // The mapping between categories and icons,
  // stored as an array of [category, categoryName, icon] tuples,
  // one per category.
  mapping: CategoricalPictogramMapping[],
}

interface LinksParameters {
  // The name of the variable that contains intensity / volume information
  variable: string,
  // How to scale the width of the links
  sizeType: 'fixed' | 'proportional' | 'graduated',
  // Classification parameters (if not specified, the links are not classified
  // and their width is computed as a direct proportion of the value of the variable)
  classification?: {
    // The classification method to group the links
    classificationMethod: ClassificationMethod,
    // The number of classes
    classes: number,
    // The break values (computed or manually set)
    breaks: number[],
    // The thickness of the links, for each class
    sizes: number[],
  },
  // Sizes parameter (when no classification is specified)
  proportional?: {
    referenceRadius: number,
    referenceValue: number,
  },
  type: LinkType,
  head: LinkHeadType,
  curvature: LinkCurvature,
  position: LinkPosition,
  filters: Filter[],
}

interface Filter {
  // The name of the variable to filter
  variable: string,
  // The operator to use for the filter
  operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in',
  // The value to compare with
  value: string | number,
}

export enum LinkType {
  Exchange = 'Exchange',
  Link = 'Link',
  BilateralVolume = 'BilateralVolume',
}

export enum LinkHeadType {
  None = 'None',
  Arrow = 'Arrow',
  // NoneOnSymbol = 'NoneOnSymbol',
  // ArrowOnSymbol = 'ArrowOnSymbol',
}

export enum LinkCurvature {
  StraightOnPlane = 'StraightOnPlane',
  StraightOnSphere = 'StraightOnSphere',
  Curved = 'Curved',
}

export enum LinkPosition {
  // Initial link position:
  // the link goes from origin to destination
  Initial = 'initial',
  // Shifted link position:
  // I<->J is represented by two links I->J and J->I
  Shifted = 'shifted',
  // Shared link position:
  // I<->J is represented by a half link (+ half arrow head) I->J
  // and a half link (+ half arrow head) J->I
  Shared = 'shared',
}

type AllowChoroplethLegend = Pick<ClassificationParameters, 'variable' | 'palette' | 'breaks' | 'noDataColor'>;

export enum RepresentationType {
  choropleth = 'choropleth',
  proportionalSymbols = 'proportionalSymbols',
  categoricalChoropleth = 'categoricalChoropleth',
  categoricalPictogram = 'categoricalPictogram',
  // proportionalSymbolsAndCategories = 'proportionalSymbolsAndCategories',
  // proportionalSymbolsAndRatio = 'proportionalSymbolsAndRatio',
  discontinuity = 'discontinuity',
  smoothed = 'smoothed',
  cartogram = 'cartogram',
  links = 'links',
  grid = 'grid',
  waffle = 'waffle',
  mushrooms = 'mushrooms',
  sphere = 'sphere',
  graticule = 'graticule',
  labels = 'labels',
  default = 'default',
}

export enum ProcessingOperationType {
  aggregation = 'aggregation',
  selection = 'selection',
  simplification = 'simplification',
}

export enum TableOperationType {
  layerCreationFromTable = 'layerCreationFromTable',
}

export enum AnalysisOperationType {
  pointAggregation = 'pointAggregation',
  simpleLinearRegression = 'simpleLinearRegression',
  multipleLinearRegression = 'multipleLinearRegression',
  principalComponentAnalysis = 'principalComponentAnalysis',
}

export enum PointAggregationMeshType {
  Grid = 'Grid',
  PolygonLayer = 'PolygonLayer',
}

export enum PointAggregationStockType {
  Count = 'Count',
  WeightedCount = 'WeightedCount',
}

export enum PointAggregationRatioType {
  Density = 'Density',
  Mean = 'Mean',
  StandardDeviation = 'StandardDeviation',
  WeightedDensity = 'WeightedDensity',
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
  kernel: KdeKernel;
}

export enum KdeKernel {
  Gaussian = 'Gaussian',
  // Epanechnikov = 'Epanechnikov',
  // Quartic = 'Quartic',
  Triangular = 'Triangular',
  Uniform = 'Uniform',
  // Biweight = 'Biweight',
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
  function: 'Gaussian' | 'Pareto';
}

export enum GridCellShape {
  square = 'square',
  diamond = 'diamond',
  hexagon = 'hexagon',
  triangle = 'triangle',
}

type LegendTextElements = 'title' | 'subtitle' | 'labels' | 'note';

interface LegendBase {
  // The id of the legend
  id: string,
  // The title of the legend
  title: LegendTextElement,
  // The subtitle of the legend
  subtitle: LegendTextElement,
  // The (bottom) note of the legend
  note: LegendTextElement,
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
  // The id of the layer the legend is associated with
  layerId: string,
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
 * The parameters of the legend for layers using the default renderer
 */

interface DefaultLegend extends LegendBase {
  type: LegendType.default,
  // The type of geometry of the corresponding layer
  typeGeometry: 'point' | 'linestring' | 'polygon',
  // Whether to display the entry as a polygon (for linestring and point layers)
  // or as the real shape (i.e a line or a point)
  displayAsPolygon: boolean,
  // The text properties of the labels (and no-data label if any)
  labels: LegendTextElement,
  // Box width (for polygon layers), or line length (for linestring layers),
  // or symbol size (for point layers)
  boxWidth: number,
  // Box height (for polygon layers only)
  boxHeight: number,
  // The corner radius of each box (rx and ry of each rect),
  // only used for polygon layers
  boxCornerRadius: number,
}

/**
 * The parameters of the legend for choropleth maps
 */
interface ChoroplethLegend extends LegendBase {
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
  // Whether to display the no-data box
  noDataBox: boolean,
  // Whether to display the stroke of the boxes
  stroke: boolean,
  // Whether to display a tick between each box
  tick: boolean,
}

/**
 * The parameters of the legend for categorical choropleth maps
 */
interface CategoricalChoroplethLegend extends LegendBase {
  type: LegendType.categoricalChoropleth,
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
  // Whether to display the no-data box
  noDataBox: boolean,
  // Whether to display the stroke of the boxes
  stroke: boolean,
  // Whether to display a tick between each box
  tick: boolean,
}

/**
 * The parameters of the legend for proportional symbols
 */
interface ProportionalSymbolsLegend extends LegendBase {
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
  // The symbol type
  symbolType: ProportionalSymbolsSymbolType,
}

interface LabelsLegend extends LegendBase {
  type: LegendType.labels,
  // The text properties of the labels
  labels: LegendTextElement,
}

interface DiscontinuityLegend extends LegendBase {
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

interface WaffleLegend extends LegendBase {
  type: LegendType.waffle,
  // Spacing between the symbols
  spacing: number,
  // Name of each variable
  variableNames: string[],
}

interface MushroomsLegend extends LegendBase {
  type: LegendType.mushrooms,
  // Values of the symbols in the legend, for both top and bottom
  // part of the mushroom / of the legend
  values: { top: number[], bottom: number[] },
  // The text properties of the labels
  labels: LegendTextElement,
  // The title for the top variable
  topTitle: LegendTextElement,
  // The title for the bottom variable
  bottomTitle: LegendTextElement,
}

interface ChoroplethHistogramLegend extends LegendBase {
  type: LegendType.choroplethHistogram,
  // The width of the histogram
  width: number,
  // The height of the histogram
  height: number,
  // The rounding of the values displayed on the axes
  roundDecimals: number,
  // The properties of the text in the chart axis
  axis: LegendTextElement,
  // Should we display the mean
  meanOptions?: {
    color: string,
    width: number,
    value: number,
  },
  // Should we display the median
  medianOptions?: {
    color: string,
    width: number,
    value: number,
  },
  // Should we display standard deviation bars
  stddevOptions?: {
    color: string,
    width: number,
    values: [number, number],
  },
  // Should we display the population (as a rug plot)
  populationOptions?: {
    color: string,
    width: number,
    height: number,
    series: number[],
  },
}

interface CategoricalChoroplethBarchartLegend extends LegendBase {
  type: LegendType.categoricalChoroplethBarchart,
  // The width of the bar chart
  width: number,
  // The height of the bar chart
  height: number,
  // The properties of the text in the chart axis
  axis: LegendTextElement,
  // The orientation of the bar chart
  orientation: Orientation,
  // Whether to order the bars by the number of occurrence
  // or by the order of the categories
  order: 'ascending' | 'descending' | 'none',
}

interface LinearRegressionScatterPlot extends LegendBase {
  type: LegendType.linearRegressionScatterPlot,
  // The width of the scatter plot
  width: number,
  // The height of the scatter plot
  height: number,
  // The properties of the text in the chart axis
  axis: LegendTextElement,
  // The rounding of the values displayed on the axes
  roundDecimals: number,
  // The color of the dots
  dotColor: string,
  // The color of the regression line
  regressionLineColor: string,
  // Whether to display the confidence interval
  confidenceInterval: boolean,
  // The color of the confidence interval
  confidenceIntervalColor: string,
}

interface CategoricalPictogramLegend extends LegendBase {
  type: LegendType.categoricalPictogram,
  // The spacing between the symbols when the legend is not stacked
  // (i.e. when the layout is horizontal or vertical)
  spacing: number,
  // The text properties of the labels
  labels: LegendTextElement,
}

export type Legend = (
  ChoroplethLegend
  | CategoricalChoroplethLegend
  | ProportionalSymbolsLegend
  | LabelsLegend
  | DiscontinuityLegend
  | WaffleLegend
  | MushroomsLegend
  | CategoricalChoroplethBarchartLegend
  | ChoroplethHistogramLegend
  | LinearRegressionScatterPlot
  | CategoricalPictogramLegend
  | DefaultLegend
);

export interface ID3Element {
  __data__: GeoJSONFeature,
}

export interface IZoomable {
  __zoom: d3.ZoomTransform,
}

// We have multiple king of legends
// (choropleth, proportional, categorical, ...)
export enum LegendType {
  default = 'default',
  choropleth = 'choropleth',
  proportional = 'proportional',
  categoricalChoropleth = 'categoricalChoropleth',
  categoricalPictogram = 'categoricalPictogram',
  discontinuity = 'discontinuity',
  labels = 'labels',
  waffle = 'waffle',
  mushrooms = 'mushrooms',
  choroplethHistogram = 'choroplethHistogram',
  categoricalChoroplethBarchart = 'categoricalChoroplethBarchart',
  linearRegressionScatterPlot = 'linearRegressionScatterPlot',
}

export enum Orientation {
  horizontal = 'horizontal',
  vertical = 'vertical',
}

export enum LayoutFeatureType {
  Rectangle,
  NorthArrow,
  ScaleBar,
  Line,
  FreeDrawing,
  Text,
  Image,
}

export enum DistanceUnit {
  m = 'm',
  km = 'km',
  mi = 'mi',
  ft = 'ft',
  yd = 'yd',
  nmi = 'nmi',
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

export interface NorthArrow extends LayoutFeatureBase {
  type: LayoutFeatureType.NorthArrow,
  // The size of the north arrow
  size: number,
  // Whether to rotate automatically the north arrow
  // to always point to the north
  autoRotate: boolean,
  // The rotation of the north arrow
  rotation: number,
  // The style of the north arrow
  style: 'simple' | 'fancy',
  // The fill color of the north arrow
  fillColor: string,
  // The fill opacity of the north arrow
  // fillOpacity: number,
  // The stroke color of the north arrow
  // strokeColor: string,
  // The stroke width of the north arrow
  // strokeWidth: number,
  // The stroke opacity of the north arrow
  // strokeOpacity: number,
  backgroundRect: BackgroundRect,
}

export enum ScaleBarStyle {
  simpleLine = 'simpleLine',
  lineWithTicksOnTop = 'lineWithTicksOnTop',
  lineWithTicksOnBottom = 'lineWithTicksOnBottom',
  blackAndWhiteBar = 'blackAndWhiteBar',
}

export enum ScaleBarBehavior {
  // Absolute size: the scale bar conserves its size (in pixels)
  // but the distance it represents changes when the map is zoomed in or out
  // (and so the distance displayed on the scale bar changes)
  absoluteSize = 'absoluteSize',
  // Geographic size: the scale bar conserves the distance it represents
  // (in the given unit) but its size (in pixels) changes when the map is zoomed in or out
  geographicSize = 'geographicSize',
}

export enum ScaleBarMeasureLocation {
  // The distance is measured on the center of the map
  centerMap = 'centerMap',
  // The distance is measured under the scale bar
  underScaleBar = 'underScaleBar',
}

export interface ScaleBar extends LayoutFeatureBase {
  type: LayoutFeatureType.ScaleBar,
  // The width of the scale bar (in px)
  width: number,
  // The height of the scale bar
  height: number,
  // The rotation of the scale bar
  rotation: number,
  // The unit of the scale bar
  unit: DistanceUnit,
  // The length of the scale bar on the map (in meters)
  distance: number,
  // The label of the scale bar (displayed on top of it)
  label: LegendTextElement,
  // The tick values
  tickValues: number[],
  // The distance between the ticks and the scale bar
  // tickPadding: number,
  // The position of the label (top or bottom)
  labelPosition: 'top' | 'bottom',
  // The style of the scaleBar
  style: ScaleBarStyle,
  // Whether to display a rectangle behind the layout feature
  backgroundRect: BackgroundRect,
  // Whether the scale bar conserves its absolute size
  // or its geographic size (the distance it represents)
  // when the map is zoomed in or out
  behavior: ScaleBarBehavior,
  // Whether the distance is measured on the center of the map
  // or under the scale bar
  measureLocation: ScaleBarMeasureLocation,
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
  // Whether to display a rectangle behind the layout feature
  backgroundRect: BackgroundRect,
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
  // The font color opacity of the text
  fontOpacity: number,
  // The font style of the text
  fontStyle: 'normal' | 'italic',
  // The font weight of the text
  fontWeight: 'normal' | 'bold',
  // The text anchor of the text
  textAnchor: 'start' | 'middle' | 'end',
  // The text decoration of the text
  textDecoration: 'none' | 'underline' | 'line-through',
  // The angle of rotation of the text
  rotation: number,
  // Whether to display a rectangle behind the text
  backgroundRect: BackgroundRect,
  // Whether to create a halo around the text
  halo?: {
    color: string,
    width: number,
  },
}

export enum ImageType {
  RASTER = 'RASTER',
  SVG = 'SVG',
}

export interface Image extends LayoutFeatureBase {
  type: LayoutFeatureType.Image,
  // The image content (either the base64 content of the PNG or the SVG content)
  content: string,
  // The size of the image
  size: number,
  // The rotation of the image
  rotation: number,
  // Whether to display a rectangle behind the image
  backgroundRect: BackgroundRect,
  // The type of the image (raster or vector)
  imageType: ImageType,
  // Do we allow to modify the fill and stroke of the image (only for SVG images)
  allowModifyFillStroke?: boolean,
  // The fill color of the image
  // (only used optionally for SVG images)
  fillColor?: string,
  // The fill opacity of the image
  // (only used optionally for SVG images)
  fillOpacity?: number,
  // The stroke color of the image
  // (only used optionally for SVG images)
  strokeColor?: string,
  // The stroke width of the image
  // (only used optionally for SVG images)
  strokeWidth?: number,
  // The stroke opacity of the image
  // (only used optionally for SVG images)
  strokeOpacity?: number,
}

export type LayoutFeature = (
  Rectangle
  | NorthArrow
  | ScaleBar
  | Line
  | FreeDrawing
  | Text
  | Image
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
  bbox?: [number, number, number, number],
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
  bbox?: [number, number, number, number],
}

// A GeoJSON FeatureCollection
interface GeoJSONFeatureCollection {
  type: string,
  features: GeoJSONFeature[],
  bbox?: [number, number, number, number],
  crs?: {
    type: string,
    properties: {
      name: string,
    },
  },
}

interface DropShadowOptions {
  dx: number,
  dy: number,
  stdDeviation: number,
  color: string,
}

interface BlurOptions {
  stdDeviation: number,
}

interface ProjectDescription {
  version: string,
  applicationSettings: ApplicationSettingsStoreType,
  layers: LayerDescription[],
  layoutFeaturesAndLegends: (LayoutFeature | Legend)[],
  map: MapStoreType,
  tables: TableDescription[],
}
