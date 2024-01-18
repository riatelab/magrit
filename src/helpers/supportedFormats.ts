/**
 * Supported file formats for export (vector data)
 */
export enum SupportedGeoFileTypes {
  CSV = 'csv',
  GeoJSON = 'geojson',
  GML = 'gml',
  KML = 'kml',
  Shapefile = 'shp',
  TopoJSON = 'topojson',
  GeoPackage = 'gpkg',
}

/**
 * Supported file formats for export (tabular data)
 */
export enum SupportedTabularFileTypes {
  CSV = 'csv',
  TSV = 'tsv',
  ODS = 'ods',
  XLS = 'xls',
  XLSX = 'xlsx',
  JSON = 'json',
}

/**
 * Allowed mime types for import
 */
export const allowedMimeTypes: string[] = [
  // For zipped shapefiles or zipped gml
  'application/zip',
  'application/x-zip-compressed',
  'application/x-zip',
  'application/x-compressed',
  // For shapefiles
  'application/octet-stream',
  'application/x-octet-stream',
  'application/x-binary',
  'application/x-shp', // For .shp files
  'application/x-esri-shape', // For .shx files
  'application/x-esri-crs', // For .prj files
  'application/x-dbf', // For .dbf files
  '', // For .cpg files
  // For geojson
  'application/json',
  'application/geo+json',
  // For geopackage
  'application/geopackage+sqlite3',
  // For topojson
  'application/json',
  // For gml
  'application/gml+xml',
  // For kml
  'application/vnd.google-earth.kml+xml',
  // For flatgeobuf
  '', // Currently flatgeobuf files come without mime type in Firefox / Chrome
  // For csv
  'text/csv',
  'text/plain',
  // For xls, xlsx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

/**
 * Allowed file extensions for import
 */
export const allowedFileExtensions: string[] = [
  'zip',
  'shp',
  'shx',
  'prj',
  'dbf',
  'cpg',
  'json',
  'geojson',
  'gpkg',
  'topojson',
  'gml',
  'kml',
  'flatgeobuf',
  'csv',
  'tsv',
  'xls',
  'xlsx',
  'ods',
];
