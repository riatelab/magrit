import type { BaseTranslation } from '../i18n-types';

const fr = {
  StartApplication: 'Démarrer l\'Application',
  SuccessButton: 'Confirmation',
  CancelButton: 'Annulation',
  DropFilesHere: 'Déposez le(s) fichier(s) ici !',
  SupportedVectorFormats: 'Les formats vectoriels supportés sont : ESRI Shapefile (.shp, .shx, .dbf, .prf, .cpg), GeoJSON (.json ou .geojson), TopoJSON (.topojson ou .json), GML (.gml), KML (.kml).',
  SupportedTabularFormats: 'Les formats de fichiers tabulaires supportés sont : Excel (.xls, .xlsx), CSV (.csv) et les feuilles de calculs OpenDocument (.ods).',
  UnsupportedFormat: 'Format non supporté',
  FilesDetected: '{{ Un fichier détecté | ?? fichiers détectés }}',
  ImportFiles: 'Importer le(s) fichier(s)',
  LeftMenu: {
    Import: 'Import des données',
    LayerManager: 'Gestion des couches',
    RepresentationChoice: 'Choix de la représentation',
    ExportSection: 'Export des données',
  },
  LayerManager: {
    point: 'Couche de points',
    line: 'Couche de lignes',
    polygon: 'Couche de polygones',
    raster: 'Couche raster',
    table: 'Tableau de données',
    Delete: 'Suppression de la couche',
    AttributeTable: 'Table attributaire',
    FitZoom: 'Zoom sur la couche',
    ToggleVisibility: 'Afficher / Masquer',
  },
} satisfies BaseTranslation;

export default fr;
