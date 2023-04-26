import type { BaseTranslation } from '../i18n-types';

const en = {
  StartApplication: 'Start Application',
  SuccessButton: 'Confirm',
  CancelButton: 'Cancel',
  DropFilesHere: 'Drop your file(s) here !',
  SupportedVectorFormats: 'Supported vector formats are: ESRI Shapefile (.shp, .shx, .dbf, .prf, .cpg), GeoJSON (.json ou .geojson), TopoJSON (.topojson ou .json), GML (.gml) and KML (.kml).',
  SupportedTabularFormats: 'Supported tabular formats are: Excel (.xls, .xlsx), CSV (.csv) and OpenDocument Spreadsheet (.ods).',
  UnsupportedFormat: 'Unsupported format',
  FilesDetected: '{{ One file detected | ?? files detected }}',
  ImportFiles: 'Import files',
} satisfies BaseTranslation;

export default en;
