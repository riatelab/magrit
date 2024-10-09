# Links / Flows

::: warning

The english version of the documentation is currently under construction.

Some parts are not yet translated and some translations may be incomplete or inaccurate.

:::

This type of map uses lines whose thickness is proportional to the intensity of the phenomenon to represent the connections
(flows / links) between pairs of locations.
A number of factors, such as the presence of too many overlaps, can impair the legibility of this type of representation.
This type of map generally requires a selection to be made after the first rendering, consisting, for example, in not representing
links with the lowest intensities, or in representing only links originating or terminating at a given location.

Magrit offers representing line thickness in several ways:

- by discretizing the values to be used (choice of a type of discretization and a number of classes, sometimes enabling better prioritization of information), or,
- without discretizing the values (the thickness of the lines is thus strictly proportional to the value of its intensity).
  
Magrit also proposes several types of link:

- Link / simple link: a line connects two points, with a notion of direction.
- Exchange: a line connects two points, with a notion of direction and a thickness proportional to the intensity of the exchange.
- Bilateral volume: a line connects two points, without any notion of direction, and with a thickness proportional to the intensity of the exchange (accumulation of exchanges in both directions).

The "link/single link" link type is the simplest to implement, as it doesn't require a column representing the intensity
of the link.

The other two link types require an additional column containing the intensity of the link.
In the case of the "Exchange" type, a line is created for each pair of points, while in the case of the
"Bilateral volume" type, a single line is created for each pair of points, with a thickness proportional
to the sum of exchanges in both directions.

## Link display configuration after layer creation

Once the link layer has been created, it is possible to filter the links to be displayed according to several criteria:

- the intensity value of links, if applicable,
- link length (in km),
- link origin and destination.


<ZoomImg
    src="/link-selection.png"
    alt="Link selection"
    caption="Link selection"
/>

## Example

<ZoomImg
    src="/link-mobilite-pro-Ain.png"
    alt="Example of a map, professional mobility from Ain (French department)"
    caption="Example of a map, professional mobility from Ain (French department)"
/>

<ZoomImg
    src="/link-map.png"
    alt="Example of a map, after selecting the origin 'France' and distance less than 1015 km"
    caption="Example of a map, after selecting the origin 'France' and distance less than 1015 km"
/>
