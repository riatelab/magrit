import {
  getAsymmetricDivergingColors, getPalette, getPaletteNumbers, getSequentialColors,
} from 'dicopal';
import { CustomPalette } from '../global';

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
