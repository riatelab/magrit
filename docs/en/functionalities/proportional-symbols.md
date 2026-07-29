# Proportional symbols

These maps allow you to represent **stock data** (or absolute quantitative data) with proportional symbols.
The size of the symbols is proportional to the value of the variable to be represented.

Stock data examples include the number of inhabitants, the number of companies, the yield of a crop, etc.

## Symbol choice

The following symbols can be used:
- **Circle**
- **Square**
- **Line** (for linear data only)

Symbol positioning depends on the geometry of the entities in the data layer:

- for point features, symbols are positioned on points,
- for linear entities, "circle" and "square" symbols are positioned at the center of the line, and "line" symbols are positioned along the line,
- for surface entities, "circle" and "square" symbols are positioned at the center of the surface.

## Symbol overlap

When selecting "circle" or "square" symbols, you can choose whether or not the symbols are allowed to overlap.

By default, the symbols are allowed to overlap (since they are positioned at the center of the entities).

If the "avoid overlapping" option is activated, symbols are moved to avoid overlapping.

## Symbol color

The color of the symbols can be:
- **Unique**: all symbols have the same color,
- **Relative quantitative variable**: the color of the symbols varies according to the value of the variable to be represented, as in a choropleth map,
- **Qualitative variable**: the color of the symbols varies according to the value of a qualitative variable.

## Reference size

When you set the reference value and the reference size, symbols are scaled so that the reference
size always corresponds to the same symbol area, regardless of the symbol type you choose:

- For squares, the reference size is the side length of the square drawn for the reference value
  (so a reference size of 100 px means a 100 × 100 px square, i.e. an area of 10,000 px²).
- For circles, the reference size defines an equivalent area: the circle drawn for the reference value
  has the same area as a square of the reference size (so a reference size of 100 px means an area of 10,000 px²,
  which corresponds to a circle with a radius of about 56.4 px — not a radius of 100 px).
  For lines, the reference size is simply the line width used for the reference value; other line
  widths are scaled proportionally to the values (not to an equivalent area).

## Examples

<ZoomImg
    src="/prop-symbols-0.png"
    alt="Proportional symbols map (unique color)"
    caption="Proportional symbols map (unique color)"
/>

<ZoomImg
    src="/prop-symbols-choro.png"
    alt="Proportional symbols map (coloration by quantitative variable)"
    caption="Proportional symbols map (coloration by quantitative variable)"
/>

<ZoomImg
    src="/prop-symbols-typo.png"
    alt="Proportional symbols map (coloration by qualitative variable)"
    caption="Proportional symbols map (coloration by qualitative variable)"
/>
