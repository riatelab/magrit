export {}

declare global {
  interface FileEntry {
    name: string,
    ext: string,
    file: File,
  }

  type CustomFileList = FileEntry[];

  interface LayerDescription {
    id: number,
    name: string,
    type: string,
  }
}