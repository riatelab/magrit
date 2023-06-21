import { allowedFileExtensions, allowedMimeTypes } from './supportedFormats';

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
  if (
    allowedMimeTypes.indexOf(file.file.type) > -1
    && allowedFileExtensions.indexOf(file.ext) > -1
  ) {
    return true;
  }
  return false;
}
