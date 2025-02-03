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

export enum SupportedTextualTabularFileTypes {
  CSV = 'csv',
  TSV = 'tsv',
  TXT = 'txt',
  JSON = 'json',
}

export enum SupportedBinaryTabularFileTypes {
  ODS = 'ods',
  XLSX = 'xlsx',
  GeoPackage = 'gpkg',
}

/**
 * Supported file formats for export (tabular data)
 */
export enum SupportedTabularFileTypes {
  CSV = 'csv',
  JSON = 'json',
  ODS = 'ods',
  TSV = 'tsv',
  TXT = 'txt',
  XLSX = 'xlsx',
  GeoPackage = 'gpkg',
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
  // '', // For .cpg files
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
  // For xlsx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // For ods
  'application/vnd.oasis.opendocument.spreadsheet',
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
  // 'flatgeobuf',
  'csv',
  'tsv',
  'xlsx',
  'ods',
];

export const shapefileExtensions: string[] = [
  'shp',
  'shx',
  'prj',
  'dbf',
  'cpg',
];

export const shapefileMandatoryExtensions: string[] = [
  'shp',
  'shx',
  'dbf',
  'prj',
];
