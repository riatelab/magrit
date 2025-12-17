import {
  getAsymmetricDivergingColors, getPalette, getPalettes,
  getPaletteNumbers, getSequentialColors,
} from 'dicopal';
import chroma from 'chroma-js';

// Helpers
import d3 from './d3-custom';
import { Mpow } from './math';

import { CustomPalette } from '../global';
import * as PaletteThumbnails from './palette-thumbnail';

export function decimalToHex(d: number, padding = 0): string {
  let hex = d.toString(16);

  while (hex.length < padding) {
    hex = `0${hex}`;
  }

  return hex;
}

export function makeHexColorWithAlpha(baseColor: string, opacity: number) {
  return `${baseColor}${decimalToHex(Math.round(opacity * 255), 2)}`;
}

// TODO: we definitely don't want to use this function, this is just for testing / for dev purposes.
export function randomColor() {
  return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}

export function randomColorFromCategoricalPalette(paletteName = 'Vivid'): string {
  const numbers = getPaletteNumbers(paletteName);
  if (numbers.length === 0) {
    throw new Error('Palette does not exist');
  }
  const maxNumber = numbers[numbers.length - 1];
  const pal = getPalette(paletteName, maxNumber)!.colors;
  return pal[Math.floor(Math.random() * pal.length)];
}

export function getPaletteWrapper(
  paletteName: string,
  n: number,
  reversePalette: boolean,
  divergingOptions?: any,
): CustomPalette {
  const numbers = getPaletteNumbers(paletteName);
  if (numbers.length === 0) {
    throw new Error('Palette does not exist');
  }
  const refPal = getPalette(paletteName, numbers[numbers.length - 1])!;
  const type = refPal.type as 'sequential' | 'diverging' | 'qualitative';
  // eslint-disable-next-line no-nested-ternary
  const colors = type === 'sequential'
    ? getSequentialColors(paletteName, n, reversePalette)
    : type === 'qualitative'
      ? getPalette(paletteName, n)!.colors
      : getAsymmetricDivergingColors(
        paletteName,
        divergingOptions!.classLeft,
        divergingOptions!.classRight,
        divergingOptions!.centralClass,
        divergingOptions!.balanced,
        reversePalette,
      );

  return {
    id: `${paletteName}-${n}`,
    name: paletteName,
    number: n,
    type,
    colors,
    provenance: 'dicopal',
    reversed: reversePalette,
    divergingOptions,
  };
}

/**
 * Code adapted from https://stackoverflow.com/a/41491220,
 * itself based on answer https://stackoverflow.com/a/3943023.
 *
 * @param bgColor
 * @param lightColor
 * @param darkColor
 */
export function pickTextColorBasedOnBgColor(
  bgColor: string,
  lightColor: string,
  darkColor: string,
) {
  const color = (bgColor.charAt(0) === '#') ? bgColor.substring(1, 7) : bgColor;
  const r = parseInt(color.substring(0, 2), 16); // hexToR
  const g = parseInt(color.substring(2, 4), 16); // hexToG
  const b = parseInt(color.substring(4, 6), 16); // hexToB
  const uicolors = [r / 255, g / 255, b / 255];
  const c = uicolors.map((col) => {
    if (col <= 0.03928) {
      return col / 12.92;
    }
    return Mpow((col + 0.055) / 1.055, 2.4);
  });
  const L = (0.2126 * c[0]) + (0.7152 * c[1]) + (0.0722 * c[2]);
  return (L > 0.179) ? darkColor : lightColor;
}

/**
 * Convert a color definition in rgb (e.g. 'rgb(255, 0, 0)') to hexadecimal (e.g. '#ff0000').
 *
 * @param rgbString
 * @returns {string} - The hexadecimal color
 */
const rgbToHex = (rgbString: string): string => {
  if (rgbString.startsWith('#')) return rgbString;
  const [r, g, b] = rgbString
    .match(/\d+/g)!.map((x) => parseInt(x, 10));
  // eslint-disable-next-line no-bitwise
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

/**
 * @description Helper to generate colors for a (maybe interpolated) sequential palette,
 * given an existing sequential palette name.
 *
 * @param {string[]} baseColors - Current colors of the palette
 * @param {number} classNumber - Number of classes wanted
 * @return {string[]} - The generated palette, as an array of hexadecimal colors.
 */
export function interpolateColors(
  baseColors: string[],
  classNumber: number,
): string[] {
  return d3.quantize(
    d3.scaleLinear()
      .domain(
        d3.range(0, 1 + 1 / baseColors.length, 1 / (baseColors.length - 1)),
      )
      .range(baseColors as never[]),
    classNumber,
  ).map((d: unknown) => rgbToHex(d as string));
}

// eslint-disable-next-line arrow-body-style
const filterUnwantedSeqPalettes = (d) => {
  return !(d.provider === 'cmocean' && d.name === 'Gray')
    && !(d.provider === 'cmocean' && d.name === 'Oxy')
    && !(d.provider === 'scientific' && d.name === 'Oleron');
};

// eslint-disable-next-line arrow-body-style
const filterUnwantedDivPalettes = (d) => {
  return !(d.provider === 'lightbartlein' && d.name === 'BrownBlue12');
};

// The palettes we want to propose in the app for sequential schemes
export const availableSequentialPalettes = getPalettes({ type: 'sequential', number: 8 })
  .filter(filterUnwantedSeqPalettes)
  .map((d) => ({
    name: `${d.name} (${d.provider})`,
    value: d.name,
    prefixImage: PaletteThumbnails[`img${d.provider}${d.name}` as never] as string,
  }));

// The palettes we want to propose in the app for diverging schemes
export const availableDivergingPalettes = getPalettes({ type: 'diverging', number: 8 })
  .filter(filterUnwantedDivPalettes)
  .map((d) => ({
    name: `${d.name} (${d.provider})`,
    value: d.name,
    prefixImage: PaletteThumbnails[`img${d.provider}${d.name}` as never] as string,
  }));

export const bivariatePalettes = [
  {
    name: 'RdBu',
    provider: 'Joshua Stevens',
    colors: [
      '#e8e8e8', '#e4acac', '#c85a5a',
      '#b0d5df', '#ad9ea5', '#985356',
      '#64acbe', '#627f8c', '#574249',
    ],
  },
  {
    name: 'BuPu',
    provider: 'Joshua Stevens',
    colors: [
      '#e8e8e8', '#ace4e4', '#5ac8c8',
      '#dfb0d6', '#a5add3', '#5698b9',
      '#be64ac', '#8c62aa', '#3b4994',
    ],
  },
  {
    name: 'GnBu',
    provider: 'Joshua Stevens',
    colors: [
      '#e8e8e8', '#b5c0da', '#6c83b5',
      '#b8d6be', '#90b2b3', '#567994',
      '#73ae80', '#5a9178', '#2a5a5b',
    ],
  },
  {
    name: 'PuOr',
    provider: 'Joshua Stevens',
    colors: [
      '#e8e8e8', '#e4d9ac', '#c8b35a',
      '#cbb8d7', '#c8ada0', '#af8e53',
      '#9972af', '#976b82', '#804d36',
    ],
  },
  {
    name: 'BuRd',
    colors: [
      '#e8e8e8', '#d8a4a4', '#c75a5a',
      '#a6b1d3', '#a6a4a4', '#a65a5a',
      '#657cbf', '#657ca4', '#655a5a',
    ],
  },
].map((p) => ({
  id: `${p.name}-bivariate`,
  name: p.provider ? `${p.name} (${p.provider})` : p.name,
  number: 9,
  type: 'custom',
  colors: p.colors,
  provenance: 'user',
  reversed: false,
} as CustomPalette));

const makeBivariatePaletteThumbnail = (palette: CustomPalette): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const size = 60;
  canvas.width = size;
  canvas.height = size;

  const cellSize = size / 3;

  for (let i = 0; i < 3; i += 1) {
    for (let j = 0; j < 3; j += 1) {
      ctx.fillStyle = palette.colors[i * 3 + j];
      ctx.fillRect(j * cellSize, (2 - i) * cellSize, cellSize, cellSize);
    }
  }

  return canvas.toDataURL();
};

export const availableBivariatePalettes = bivariatePalettes.map((d) => ({
  name: d.name,
  value: d.id,
  prefixImage: makeBivariatePaletteThumbnail(d),
}));

/**
 * Generate bivariate colors from a base lightest color and two ("end")
 * colors for the two variables.
 * @param {string} color1
 * @param {string} color2
 * @param {string} lightest
 * @param {number} rows
 * @param {'Lab' | 'RGB' | 'Lch'} colorMode
 * @param {'darken' | 'multiply'} blendMode
 */
export const generateBivariateColors = (
  color1: string,
  color2: string,
  lightest: string,
  rows: number = 3,
  colorMode: 'Lab' | 'RGB' | 'Lch' = 'Lab',
  blendMode: 'darken' | 'multiply' = 'darken',
) => {
  const scale1 = chroma.scale([color1, lightest])
    .mode(colorMode)
    .correctLightness()
    .colors(rows);
  const scale2 = chroma.scale([color2, lightest])
    .mode(colorMode)
    .correctLightness()
    .colors(rows);

  const data = [];

  for (let i = 0; i < rows; i += 1) {
    for (let j = 0; j < rows; j += 1) {
      data.push(chroma.blend(scale1[i], scale2[j], blendMode));
    }
  }

  return data;
};
