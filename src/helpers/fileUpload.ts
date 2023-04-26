const allowedMimeTypes: string[] = [
  // For zipped shapefiles or zipped gml
  'application/zip',
  'application/x-zip-compressed',
  'application/x-zip',
  'application/x-compressed',
  // For shapefiles
  'application/octet-stream',
  'application/x-octet-stream',
  'application/x-binary',
  'application/x-shp',
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

export function prepareFileExtensions(files: FileList): CustomFileList {
  return Array.from(files).map((file: File) => {
    const name = file.name.substring(0, file.name.lastIndexOf('.'));
    const ext = file.name.substring(file.name.lastIndexOf('.') + 1, file.name.length).toLowerCase();
    console.log(file.type, name, ext, file);
    const o: { name: string, ext: string, file: File } = {
      ext,
      file,
      name,
    };
    return o;
  });
}

export function draggedElementsAreFiles(e: DragEvent): boolean {
  if (e.dataTransfer.types && !e.dataTransfer?.types.some((el) => el === 'Files')) {
    return false;
  }
  if (e.relatedTarget && e.relatedTarget.nodeType) {
    return false;
  }
  return true;
}

export function isAuthorizedFile(file: FileEntry): boolean {
  if (allowedMimeTypes.indexOf(file.file.type) > -1) {
    return true;
  }
  return false;
}
