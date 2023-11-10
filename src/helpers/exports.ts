// Import from other packages
import { topology } from 'topojson-server';

// Stores
import { getDefaultClipExtent, mapStore } from '../store/MapStore';
import { globalStore } from '../store/GlobalStore';

// Helpers
import { SupportedGeoFileTypes } from './supportedFormats';
import { convertFromGeoJSON } from './formatConversion';

// Types / Interfaces
import { getTargetSvg, redrawPaths } from './svg';
import type { GeoJSONFeatureCollection } from '../global.d';

/**
 * Get the dimensions of the SVG map element.
 * @param {SVGElement} map
 * @returns {{height: number, width: number}}
 */
const getMapDimension = (map: SVGElement): { height: number, width: number } => {
  const { width, height } = map.getBoundingClientRect();
  return { width, height };
};

/**
 * Clean the given output name to ensure it is a valid file name.
 *
 * @param {string} outputName
 * @param {string} extension
 * @returns {string}
 */
const cleanOutputName = (outputName: string, extension: string) => {
  // Remove any extension from the output name
  const newName = outputName.toLowerCase().indexOf(extension) > -1
    ? outputName.substring(0, outputName.lastIndexOf('.'))
    : outputName;

  // Remove any invalid characters from the output name and ensure it is not too long
  const regexpName = /^[().a-z0-9_-]+$/i;
  if (regexpName.test(newName) && newName.length < 250) {
    return `${newName}.${extension}`;
  }

  // Otherwise, return a default name
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
export const clickLinkFromDataUrl = async (url: string, fileName: string) => {
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

interface LoadableImage {
  onload: ((this: any, ev: any) => any) | null;
  onerror: ((reason?: any) => void) | null;
  src: string | null;
}

/**
 * Set the image source and return a promise that resolves when the image is loaded.
 *
 * @param {LoadableImage} obj
 * @param {string} src
 * @returns {Promise<LoadableImage>}
 */
function setImageSrc<T extends LoadableImage>(obj: T, src: string): Promise<T> {
  obj.src = src; // eslint-disable-line no-param-reassign
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line no-param-reassign
    obj.onload = () => resolve(obj);
    // eslint-disable-next-line no-param-reassign
    obj.onerror = reject;
  });
}

/**
 * Export the current map to an SVG file.
 *
 * @param {string} outputName - The name of the output file.
 * @param {boolean} clipToViewPort - Whether to clip the SVG to the viewport.
 * @param {object} options - Additional options.
 * @returns {Promise<boolean>}
 */
export async function exportMapToSvg(
  outputName: string,
  clipToViewPort: boolean,
  options: object = {},
) {
  const targetSvg = getTargetSvg();
  // Function to be executed after the map is exported to SVG
  // (whether it failed or succeeded)
  // in order to restore various settings
  const finallyFn = () => {
    // Restore the projection clip extent and redraw the paths
    globalStore.projection.clipExtent(getDefaultClipExtent());
    redrawPaths(targetSvg);
  };
  // Set the projection clip extent if needed
  if (clipToViewPort) {
    const mapDimensions = getMapDimension(targetSvg);
    // Apply the clip extent to the projection
    globalStore.projection.clipExtent([
      [0, 0],
      [mapDimensions.width, mapDimensions.height],
    ]);
    // Redraw the paths
    redrawPaths(targetSvg);
  } else {
    // Remove the clip extent from the projection
    globalStore.projection.clipExtent(null);
    // Redraw the paths
    redrawPaths(targetSvg);
  }
  // eslint-disable-next-line no-param-reassign
  const outputNameClean = cleanOutputName(outputName, 'svg');

  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(targetSvg);

  if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (!source.match(/^<svg[^>]+"http:\/\/www\.w3\.org\/1999\/xlink"/)) {
    source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }

  source = `<?xml version="1.0" standalone="no"?>\r\n${source}`;

  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;

  return clickLinkFromDataUrl(url, outputNameClean)
    .then(() => {
      Promise.resolve(true);
    })
    .catch((err) => {
      console.warn('Error while downloading SVG file', err);
      Promise.reject(err);
    })
    .finally(finallyFn);
}

/**
 * Export the current map to a PNG file.
 *
 * @param {string} outputName - The name of the output file.
 * @param {number} scaleFactor - The scale factor to apply to the image.
 * @returns {Promise<boolean>}
 */
export async function exportMapToPng(outputName: string, scaleFactor = 1) {
  const targetSvg = getTargetSvg();
  const mapDimensions = getMapDimension(targetSvg);
  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = mapDimensions.width;
  targetCanvas.height = mapDimensions.height;
  document.body.appendChild(targetCanvas);

  // eslint-disable-next-line no-param-reassign
  const outputNameClean = cleanOutputName(outputName, 'png');

  const mimeType = 'image/png';

  let svgXml;
  let context: CanvasRenderingContext2D;
  let image: HTMLImageElement;

  try {
    svgXml = (new XMLSerializer()).serializeToString(targetSvg);
    const tContext = targetCanvas.getContext('2d');
    if (!tContext) {
      throw new Error('Could not get canvas context');
    }
    context = tContext;
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

  await setImageSrc(
    image,
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgXml)}`,
  );

  // image.onload = function () {
  context.drawImage(image, 0, 0);
  try {
    imgUrl = targetCanvas.toDataURL(mimeType);
  } catch (err) {
    targetCanvas.remove();
    console.warn('Error when converting image to data url', err);
    return Promise.reject(err);
  }

  return clickLinkFromDataUrl(imgUrl, outputNameClean).then(() => {
    targetCanvas.remove();
    return Promise.resolve(true);
  }).catch((err) => {
    console.warn('Error when using the data url version of the image', err);
    return Promise.reject(err);
  });
}

export async function exportToGeo(
  layer: GeoJSONFeatureCollection,
  layerName: string,
  format: SupportedGeoFileTypes,
  crs = 'EPSG:4326',
) {
  console.log(layer, format, crs);
  let result = '';
  let filename = '';
  const ext = `${format}`;
  if (format === SupportedGeoFileTypes.GeoJSON) {
    result = JSON.stringify(layer);
    filename = `${layerName}.${ext}`;
  } else if (format === SupportedGeoFileTypes.TopoJSON) {
    result = JSON.stringify(topology({ layerName: layer }));
    filename = `${layerName}.${ext}`;
  } else if (format === SupportedGeoFileTypes.KML) {
    result = await convertFromGeoJSON(layer, layerName, 'KML', crs);
    filename = `${layerName}.${ext}`;
  } else if (format === SupportedGeoFileTypes.Shapefile) {
    result = await convertFromGeoJSON(layer, layerName, 'ESRI Shapefile', crs);
    filename = `${layerName}.zip`;
  } else if (format === SupportedGeoFileTypes.GML) {
    result = await convertFromGeoJSON(layer, layerName, 'GML', crs);
    filename = `${layerName}.${ext}`;
  } else if (format === SupportedGeoFileTypes.GeoPackage) {
    result = await convertFromGeoJSON(layer, layerName, 'GPKG', crs);
    filename = `${layerName}.gpkg`;
  } else {
    throw new Error(`Unsupported file format: ${format}`);
  }

  let dataStr = '';
  if (format === SupportedGeoFileTypes.GeoJSON || format === SupportedGeoFileTypes.TopoJSON) {
    dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(result)}`;
  } else if (format === SupportedGeoFileTypes.KML || format === SupportedGeoFileTypes.GML) {
    dataStr = `data:text/xml;charset=utf-8,${encodeURIComponent(result)}`;
  } else if (format === SupportedGeoFileTypes.Shapefile) {
    dataStr = `data:application/zip;base64,${result}`;
  } else if (format === SupportedGeoFileTypes.GeoPackage) {
    dataStr = `data:application/geopackage+sqlite3;base64,${result}`;
  }

  return clickLinkFromDataUrl(dataStr, filename)
    .then(() => Promise.resolve(true))
    .catch((err) => {
      console.warn('Error when using the data url version of the exported layer', err);
      return Promise.reject(err);
    });
}
