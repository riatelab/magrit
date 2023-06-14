const getMapDimension = (map: SVGElement): { height: number, width: number } => {
  const { width, height } = map.getBoundingClientRect();
  return { width, height };
};

const cleanOutputName = (outputName: string, extension: string) => {
  const newName = outputName.toLowerCase().indexOf(extension) > -1
    ? outputName.substring(0, outputName.lastIndexOf('.'))
    : outputName;
  const regexpName = /^[().a-z0-9_-]+$/i;
  if (regexpName.test(newName) && newName.length < 250) {
    return `${newName}.${extension}`;
  }
  return `export.${extension}`;
};

/**
 * Reused from Magrit source code (https://github.com/riatelab/magrit/blob/e91931fd4ed72a919f995ef24707c7593e4482a8/client/js/map_export.js#L140),
 * originally from http://stackoverflow.com/a/26047748/5050917.
 *
 */
function changeResolution(canvas: HTMLCanvasElement, scaleFactor: number) {
  // Set up CSS size if it's not set up already
  if (!canvas.style.width) canvas.style.width = `${canvas.width}px`; // eslint-disable-line no-param-reassign
  if (!canvas.style.height) canvas.style.height = `${canvas.height}px`; // eslint-disable-line no-param-reassign

  canvas.width = Math.ceil(canvas.width * scaleFactor); // eslint-disable-line no-param-reassign
  canvas.height = Math.ceil(canvas.height * scaleFactor); // eslint-disable-line no-param-reassign
  canvas.getContext('2d')?.scale(scaleFactor, scaleFactor);
}

/**
 * Download the given data URL as a file.
 *
 * @param {string} url
 * @param {string} fileName
 */
const clickLinkFromDataUrl = async (url: string, fileName: string) => {
  const res = await fetch(url);
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const dlAnchorElement = document.createElement('a');
  dlAnchorElement.setAttribute('href', blobUrl);
  dlAnchorElement.setAttribute('download', fileName);
  dlAnchorElement.style.display = 'none';
  document.body.appendChild(dlAnchorElement);
  dlAnchorElement.click();
  dlAnchorElement.remove();
  URL.revokeObjectURL(blobUrl);
};

export async function exportMapToSvg(
  outputName: string,
  clipToViewPort: boolean,
  options: object = {},
) {
  // eslint-disable-next-line no-param-reassign
  outputName = cleanOutputName(outputName);
  console.log(outputName, clipToViewPort, options);
  return Promise.resolve(true);
}

export async function exportMapToPng(outputName: string, scaleFactor = 1) {
  // eslint-disable-next-line no-param-reassign
  outputName = cleanOutputName(outputName);

  const mapDimensions = getMapDimension(document.querySelector('svg.map-zone__map'));
  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = mapDimensions.width;
  targetCanvas.height = mapDimensions.height;
  document.body.appendChild(targetCanvas);
  const targetSvg = document.querySelector('svg.map-zone__map');

  const mimeType = 'image/png';

  let svgXml;
  let context;
  let image;

  try {
    svgXml = (new XMLSerializer()).serializeToString(targetSvg);
    context = targetCanvas.getContext('2d');
    image = new Image();
  } catch (err) {
    console.warn('Error serializing SVG', err);
    return Promise.reject(err);
  }

  if (scaleFactor !== 1) {
    try {
      changeResolution(targetCanvas, scaleFactor);
    } catch (err) {
      targetCanvas.remove();
      console.warn('Error when rescaling image', err);
      return Promise.reject(err);
    }
  }
  let imgUrl;
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgXml)}`;
  image.onload = function () {
    context.drawImage(image, 0, 0);
    try {
      imgUrl = targetCanvas.toDataURL(mimeType);
    } catch (err) {
      targetCanvas.remove();
      console.warn('Error when converting image to data url', err);
      return;
    }

    clickLinkFromDataUrl(imgUrl, outputName).then(() => {
      targetCanvas.remove();
    }).catch((err) => {
      console.warn('Error when using the data url version of the image', err);
      return Promise.reject(err);
    });
  };

  return Promise.resolve(true);
}
