# Waffle map

This method represents several stocks in comparable units for each entity in the form of a grid of symbols.
For each entity, a set of symbols (of a fixed size) is used to represent the different values according to a
predefined ratio (for example, 1 symbol per 1000 units). Each stock variable is represented by a different color.


## Layer creation parameters

When creating a layer, you need to select the following parameters:

- Stock variables to be used (minimum 2),
- Symbol type (square or circle),
- The size of each symbol (radius of the circle or size of one side of the square, in pixels),
- Conversion ratio (number of units per symbol),
- Maximum number of columns for symbol display,
- Spacing between each row/column of symbols.

Once the layer has been created, it is possible to modify the color of each stock variable,
their display order and the name of each variable (as it appears in the legend).

## Example

<ZoomImg
    src="/waffle.png"
    alt="Example of a waffle map with 2 stock variables"
    caption="Example of a waffle map with 2 stock variables"
/>