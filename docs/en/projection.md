# Choosing a cartographic projection

The cartographic projection is a fundamental element in the creation of a map.
It allows the representation of the Earth's surface on a flat surface.
The choice of projection depends on the purpose of the map and the area to be represented.

In Magrit the default projection is the Natural Earth 2 projection.

You  can change the projection of your map by clicking on the "Cartographic projection" button in the left side menu.

## Dropdown menu of projections

The dropdown menu of projections allows you to choose from a list of predefined projections.

<ZoomImg
    src="/projection-short-list.png"
    alt="Dropdown menu of projections"
    caption="Dropdown menu of projections"
/>

## Customizing the projection

When using a global projection, it's usually possible to customize:
- its center (on λ, φ and γ axes),
- its standard parallel(s).

<ZoomImg
    src="/projection-detailed-params.png"
    alt="Customizing the projection"
    caption="Customizing the projection"
/>

## Window for projection selection

### Global projections

Global projections are projections that generally represent the Earth as a whole (or on the scale of a continent).

<ZoomImg
    src="/projection-panel1.png"
    alt="Selection of a global projection"
    caption="Selection of a global projection"
/>

### Local projections

Local projections are projections used to represent a smaller portion of the Earth (e.g. a country, a region).

These projections are provided by the [proj4js](https://proj4js.org/) software library and are based on the [EPSG](https://epsg.org/) database.

You can search for a projection by typing its EPSG code (e.g. "2154"), its name (e.g. "Lambert-93") or the area to which it applies ("France") in the search bar.
When the EPSG code of the desired projection is known, it is advisable to use it to avoid any ambiguity.

<ZoomImg
    src="/projection-panel2.png"
    alt="Selection of a local projection"
    caption="Selection of a local projection"
/>
