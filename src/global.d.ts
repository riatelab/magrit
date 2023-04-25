export {}

declare global {
  interface GlobalStoreType {
    nDrivers: number,
    gdalObj: any,
  }

  interface FileEntry {
    name: string,
    ext: string,
    file: File,
  }

  type CustomFileList = FileEntry[];

}