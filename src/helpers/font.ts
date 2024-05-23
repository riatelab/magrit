export const webSafeFonts = [
  'Serif',
  'Sans-serif',
  'Monospace',
  'Cursive',
];

export const fonts = [
  'Roboto',
  'Lato',
  'Open Sans',
  'Great Vibes',
  'Montserrat',
  'Pacifico',
  'Amatic SC',
  'Lobster',
  'Oswald',
  'Playfair Display',
  'Dosis',
  'League Gothic',
];

export const findCssFontDefinition = (fontName: string): string => {
  const allFontFaceRules = Array.from(document.styleSheets)
    .flatMap((s) => Array.from(s.cssRules))
    .filter((s) => s.constructor.name === 'CSSFontFaceRule') as CSSFontFaceRule[];

  return allFontFaceRules
    .filter((f) => f.style.fontFamily === fontName || f.style.fontFamily === `"${fontName}"`)
    .map((f) => f.cssText)
    .join(' ');
};
