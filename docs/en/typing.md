# Data typing

Each data type is associated with a number of possible functionalities. Once the data has been imported,
it is therefore important to define the type of each variable in the dataset you wish to map.

There are 5 possible data types in Magrit:

- Identifier (fields used to attach data)
- Stock (absolute quantitative variable)
- Ratio (relative quantitative variable)
- Category (qualitative variable)
- Unknown (e.g. for fields you don't want to use)

## Stock

Relative quantitative variables (or stock variables) express concrete quantities, and their sum has a meaning.
(number of unemployed, total population, for example).

The representation of this type of phenomenon must respect the expression of these quantities and the resulting differences in proportionality between the various elements.

Examples: Total population in thousands of inhabitants, Surface area in hectares.

## Ratios

Relative quantitative variables (also called rate variables or ratio variables), express a ratio between two quantities whose sum has no meaning.
By extension, they can be associated with numerical composite indicators (indices, etc.).

Examples: GDP per capita, Human Development Index.


## Categories

The modalities of qualitative characters are not measurable; they are names, acronyms or codes.
Qualitative modalities cannot be summed, nor averaged.

Examples: Department names, Land use type.

## Identifier

This field contains values that uniquely identify each entity in the data layer.
These fields are used to perform a data join.

Example: INSEE commune code, ISO2 country code.
