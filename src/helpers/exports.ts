// Import from other packages
import { topology } from 'topojson-server';
import { fromGeoJSON } from 'geoimport';

// GeoJSON types
import type { FeatureCollection } from 'geojson';

// Stores
import { getDefaultClipExtent, mapStore } from '../store/MapStore';
import { globalStore, setGlobalStore } from '../store/GlobalStore';
import { layersDescriptionStore } from '../store/LayersDescriptionStore';

// Helpers
import { SupportedGeoFileTypes } from './supportedFormats';
import { getTargetSvg, redrawPaths } from './svg';
import { findCssFontDefinition } from './font';

// Types / Interfaces
import {
  type LabelsParameters,
  LayoutFeatureType,
} from '../global.d';

/**
 * Get the dimensions of the SVG map element.
 * @param {SVGElement} map
 * @returns {{height: number, width: number}}
 */
const getMapDimension = (): { height: number, width: number } => ({
  width: mapStore.mapDimensions.width,
  height: mapStore.mapDimensions.height,
});
// const getMapDimension = (map: SVGElement): { height: number, width: number } => {
//   const { width, height } = map.getBoundingClientRect();
//   return { width, height };
// };

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
 * Identify the various fonts used in the SVG map and add them to the SVG.
 *
 * @param {SVGElement} svgElement
 * @param {string[]} ignoreFonts
 * @returns {void}
 */
function patchSvgForFonts(
  svgElement: SVGElement,
  ignoreFonts: string[] = ['Serif', 'Sans-serif', 'Monospace', 'Cursive'],
): void {
  function getListUsedFonts() {
    const res: string[] = [];
    // Font used in label layers
    layersDescriptionStore
      .layers
      .filter((d) => d.representationType === 'labels')
      .forEach((layer) => {
        const defaultFont = (layer.rendererParameters as LabelsParameters).default.fontFamily;
        if (!ignoreFonts.includes(defaultFont)) {
          res.push(defaultFont);
        }
        Object.keys((layer.rendererParameters as LabelsParameters).specific)
          .forEach((field) => {
            const font = (layer.rendererParameters as LabelsParameters).specific[field].fontFamily;
            if (font && font !== defaultFont) {
              res.push(font);
            }
          });
      });

    // Font used in layout features
    layersDescriptionStore
      .layoutFeaturesAndLegends
      .forEach((layoutFeatureOrLegend) => {
        if (layoutFeatureOrLegend.type === LayoutFeatureType.Text) {
          const font = layoutFeatureOrLegend.fontFamily;
          if (font && !ignoreFonts.includes(font)) {
            res.push(font);
          }
        }
        if (layoutFeatureOrLegend.title) {
          const font = layoutFeatureOrLegend.title.fontFamily;
          if (font && !ignoreFonts.includes(font)) {
            res.push(font);
          }
        }
        if (layoutFeatureOrLegend.subtitle) {
          const font = layoutFeatureOrLegend.subtitle.fontFamily;
          if (font && !ignoreFonts.includes(font)) {
            res.push(font);
          }
        }
        if (layoutFeatureOrLegend.axis) {
          const font = layoutFeatureOrLegend.axis.fontFamily;
          if (font && !ignoreFonts.includes(font)) {
            res.push(font);
          }
        }
        if (layoutFeatureOrLegend.labels) {
          const font = layoutFeatureOrLegend.labels.fontFamily;
          if (font && !ignoreFonts.includes(font)) {
            res.push(font);
          }
        }
        if (layoutFeatureOrLegend.note) {
          const font = layoutFeatureOrLegend.note.fontFamily;
          if (font && !ignoreFonts.includes(font)) {
            res.push(font);
          }
        }
      });

    return res;
  }

  const needed = getListUsedFonts();
  if (needed.length === 0) {
    return;
  }

  const fontsToAdd = needed
    .map((name) => findCssFontDefinition(name));

  const styleElem = document.createElement('style');
  styleElem.innerHTML = fontsToAdd.join(' ');
  svgElement.querySelector('defs')!.appendChild(styleElem);
}

/**
 * Create a link to download the given blob as a file.
 *
 * @param {Blob | File} blobOrFile
 * @param {string} fileName
 */
export const clickLinkFromBlob = async (blobOrFile: Blob | File, fileName: string) => {
  const url = URL.createObjectURL(blobOrFile);
  const dlAnchorElement = document.createElement('a');
  dlAnchorElement.setAttribute('href', url);
  dlAnchorElement.setAttribute('download', fileName);
  dlAnchorElement.style.display = 'none';
  document.body.appendChild(dlAnchorElement);
  dlAnchorElement.click();
  dlAnchorElement.remove();
  URL.revokeObjectURL(url);
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

  // Current state of snapping grid
  const displaySnapGrid = globalStore.displaySnappingGrid;

  // Function to be executed after the map is exported to SVG
  // (whether it failed or succeeded)
  // in order to restore various settings
  const finallyFn = () => {
    // Restore the projection clip extent and redraw the paths
    globalStore.projection.clipExtent(getDefaultClipExtent());
    // Restore the state of the snapping grid
    setGlobalStore('displaySnappingGrid', displaySnapGrid);
    // Redraw the paths
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

  // Hide the snapping grid if it is displayed
  if (displaySnapGrid) {
    setGlobalStore('displaySnappingGrid', false);
  }

  // Clone the SVG element to avoid modifying the original one
  // when including the fonts and removing the
  // layout-features/legend boxes
  const cloned = targetSvg.cloneNode(true) as SVGElement;

  // Patch the SVG to include the fonts used in the map
  patchSvgForFonts(cloned);

  // Remove the rect elements with the class "legend-box"
  // and with the class "layout-feature-box"
  cloned
    .querySelectorAll('rect.layout-feature-box[fill=transparent], rect.legend-box[fill=transparent]')
    .forEach((d) => d.remove());

  const outputNameClean = cleanOutputName(outputName, 'svg');

  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(cloned);

  // Add namespaces declarations if they are missing
  if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (!source.match(/^<svg[^>]+"http:\/\/www\.w3\.org\/1999\/xlink"/)) {
    source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }

  // Remove id / class / etc. of the root of the SVG element that we are
  // using to identify the map in the application
  source = source.replace('class="map-zone__map"', '')
    .replace('id="map-zone__map"', '')
    .replace('aria-label="map zone"', '')
    .replace('tabindex="0"', '');

  // Remove stuff from the mgt namespace
  source = source.replace(/\bmgt:[^=]+="[^"]*"/g, '');

  // Replace the internal ids by the layer names
  layersDescriptionStore.layers.forEach((layer) => {
    source = source.replaceAll(layer.id, layer.name.replaceAll(' ', '_'));
  });

  // Add the XML declaration at the beginning of the document
  source = `<?xml version="1.0" standalone="no"?>\r\n${source}`;

  const blob = new Blob([source], { type: 'image/svg+xml' });

  return clickLinkFromBlob(blob, outputNameClean)
    .then(() => Promise.resolve(true))
    .catch((err) => {
      console.warn('Error while downloading SVG file', err);
      Promise.reject(err);
    })
    .finally(finallyFn);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
    });
  });
}

/**
 * Export the current map to a PNG file.
 *
 * @param {string} outputName - The name of the output file.
 * @param {number} scaleFactor - The scale factor to apply to the image.
 * @returns {Promise<boolean>}
 */
export async function exportMapToPng(outputName: string, scaleFactor = 1) {
  const targetSvg = getTargetSvg().cloneNode(true) as SVGElement;
  const mapDimensions = getMapDimension();
  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = mapDimensions.width;
  targetCanvas.height = mapDimensions.height;
  document.body.appendChild(targetCanvas);

  // Current state of snapping grid
  const displaySnapGrid = globalStore.displaySnappingGrid;

  // Cleanup function
  const cleanUp = () => {
    targetCanvas.remove();
    // Restore the state of the snapping grid
    setGlobalStore('displaySnappingGrid', displaySnapGrid);
  };

  // Remove snapping grid if active
  setGlobalStore('displaySnappingGrid', false);

  // eslint-disable-next-line no-param-reassign
  const outputNameClean = cleanOutputName(outputName, 'png');

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
    cleanUp();
    console.warn('Error serializing SVG', err);
    return Promise.reject(err);
  }

  if (scaleFactor !== 1) {
    try {
      changeResolution(targetCanvas, scaleFactor);
    } catch (err) {
      cleanUp();
      console.warn('Error when rescaling image', err);
      return Promise.reject(err);
    }
  }

  // Remove stuff from the mgt namespace
  svgXml = svgXml.replace(/\bmgt:[^=]+="[^"]*"/g, '');

  try {
    await setImageSrc(
      image,
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgXml)}`,
    );
  } catch (err) {
    cleanUp();
    console.warn('Error when setting image source', err);
    return Promise.reject(err);
  }

  let blob;
  // image.onload = function () {
  context.drawImage(image, 0, 0);
  try {
    blob = await canvasToBlob(targetCanvas);
  } catch (err) {
    cleanUp();
    console.warn('Error when converting image to data url', err);
    return Promise.reject(err);
  }

  return clickLinkFromBlob(blob, outputNameClean).then(() => {
    cleanUp();
    return Promise.resolve(true);
  }).catch((err) => {
    cleanUp();
    console.warn('Error when using the data url version of the image', err);
    return Promise.reject(err);
  });
}

export async function exportToGeo(
  layer: FeatureCollection,
  layerName: string,
  format: SupportedGeoFileTypes,
  crs = 'EPSG:4326',
) {
  let result: string | File;
  let filename = '';
  const ext = `${format}`;
  if (format === SupportedGeoFileTypes.GeoJSON) {
    result = JSON.stringify(layer);
    filename = `${layerName}.${ext}`;
  } else if (format === SupportedGeoFileTypes.TopoJSON) {
    result = JSON.stringify(topology({ layerName: layer }));
    filename = `${layerName}.${ext}`;
  } else if (format === SupportedGeoFileTypes.KML) {
    result = await fromGeoJSON(layer, layerName, 'KML', crs);
    filename = `${layerName}.${ext}`;
  } else if (format === SupportedGeoFileTypes.Shapefile) {
    result = await fromGeoJSON(layer, layerName, 'ESRI Shapefile', crs);
    filename = `${layerName}.zip`;
  } else if (format === SupportedGeoFileTypes.GML) {
    result = await fromGeoJSON(layer, layerName, 'GML', crs);
    filename = `${layerName}.${ext}`;
  } else if (format === SupportedGeoFileTypes.GeoPackage) {
    result = await fromGeoJSON(layer, layerName, 'GPKG', crs);
    filename = `${layerName}.gpkg`;
  } else {
    throw new Error(`Unsupported file format: ${format}`);
  }

  let blob: Blob | File;
  if (format === SupportedGeoFileTypes.GeoJSON || format === SupportedGeoFileTypes.TopoJSON) {
    blob = new Blob([result], { type: 'application/json' });
  } else if (format === SupportedGeoFileTypes.KML || format === SupportedGeoFileTypes.GML) {
    blob = new Blob([result], { type: 'application/xml' });
  } else if (
    format === SupportedGeoFileTypes.Shapefile
    || format === SupportedGeoFileTypes.GeoPackage
  ) {
    blob = result as File;
  }

  return clickLinkFromBlob(blob!, filename)
    .then(() => Promise.resolve(true))
    .catch((err) => {
      console.warn('Error when using the data url version of the exported layer', err);
      return Promise.reject(err);
    });
}
