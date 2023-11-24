import { getPalette, getPaletteNumbers } from 'dicopal';

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
