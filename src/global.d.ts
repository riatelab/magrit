export {}

declare global {

  interface FileEntry {
    name: string,
    ext: string,
    file: File,
  }

  type CustomFileList = FileEntry[];

}