export function prepareFileExtensions(files: FileList): CustomFileList {
  return Array.from(files).map((file: File) => {
    const name = file.name.substring(0, file.name.lastIndexOf('.'));
    const ext = file.name.substring(file.name.lastIndexOf('.') + 1, file.name.length).toLowerCase();
    const o: { name: string, ext: string, file: File } = {
      ext,
      file,
      name: [name, ext].join('.'),
    };
    return o;
  });
}

export function isAuthorizedFile(): boolean {
  return true;
}
