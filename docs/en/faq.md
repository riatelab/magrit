# Frequently Asked Questions

#### - Why is the rendering of some SVG exports different in Inkscape/Adobe Illustrator than when displaying the map in Magrit?

You can use desktop vector graphics software such as [Inkscape](https://inkscape.org/) (free and open source - we recommend it) or [Adobe Illustrator](https://www.adobe.com/fr/products/illustrator.html) to edit SVG files.

There are also online applications for editing SVG files, such as [SVG-Edit](https://svg-edit.github.io/svgedit/) or [Method Draw](https://editor.method.ac/).

### - Why do some SVG exports render differently in Inkscape / Adobe Illustrator than when the map is displayed in Magrit?

When creating a map, if you select one of the fonts offered in Magrit (other than the user's operating system font families such as *Serif*, *Sans-Serif* and *Monospace*), the map may not render in the same way in vector drawing software (such as Inkscape or Adobe Illustrator) as it does in Magrit.

This is because the fonts used in Magrit are not installed on your machine, so the vector graphics software cannot display them correctly.

However, you can check that the map contains the fonts used in Magrit by opening the SVG file in a web browser.

To solve this problem, you can download the fonts used in your card and install them on your machine.

See the answer to the next question concerning the origin of the fonts used and how to download and install them on your machine.


### - What are the fonts offered in Magrit? What are their licenses?

The following fonts are available in Magrit:

- Montserrat
- Open Sans
- Roboto
- Great Vibes
- Lato
- Pacifico
- Amatic
- Oswald
- Lobster
- Playfair Display
- Dosis
- League Gothic

These are free, royalty-free fonts (according to a review by [Font Squirrel](https://www.fontsquirrel.com/).
They can be used freely for personal or commercial projects, and can be included in applications (as in Magrit) as well as in documents / images / etc.

It is also possible to select the font families of the user's operating system when creating a card: *Serif*, *Sans-Serif* and *Monospace*.

#### - Why is it not possible to display an "OpenStreetMap" type basemap in Magrit?

The Magrit development team chose not to integrate an “OpenStreetMap” type basemap directly into the application for several reasons:
 
- **Dependence on a third-party service**: displaying an “OpenStreetMap” basemap requires a third-party service (the OpenStreetMap server, or another provider) to retrieve the map tiles. This implies a dependence on this third-party service, which may be slow or unavailable, and in any case requires an Internet connection.
 
- **Keeping the spirit of the application**: Magrit is a thematic mapping application that lets you create and export customized maps from geographic data. The aim is to highlight the user's data and enable them to represent it clearly and effectively. The addition of an “OpenStreetMap” basemap could divert the user's attention from his own data, making the map more complex to read. On the other hand, it would probably lead to the creation of maps using the Mercator projection in cases where this is not the most appropriate.
   There are applications dedicated to the creation of maps on an “OpenStreetMap” base map (such as [uMap](https://umap.openstreetmap.fr/fr/)), which make it easy to create maps with pins, information boxes displayed on click, etc.

However, the possibility of integrating such base maps into Magrit is being studied for a future version of the application.

#### - The performance of the application seems to be degraded when using certain datasets or when adding many datasets?

Magrit uses SVG technology to display user-created maps.

This technology performs very well for moderate-sized maps, but can show its limitations when maps become very complex (many datasets, many entities, very detailed geometries, etc.).

If you are experiencing slowdowns when using Magrit, here are a few ways to improve performance:

- **Simplify data**: if you're using very detailed data (e.g. polygons with many vertices), try simplifying them when importing into Magrit (with the option provided) or before importing into Magrit.
  You can use a geometry simplification tool such as [Mapshaper](https://mapshaper.org/) to reduce the number of polygon vertices while retaining the essential information.

- **Reduce the number of datasets displayed**: if you have many datasets displayed simultaneously, try hiding (with the dedicated button in the layer manager)
  layers that are not being used (for example, after creating a choropleth map, you can hide the raw data that was used to create the map, as it is now covered by the newly created layer).

- **Reduce the number of entities displayed**: if you have a large number of entities in your datasets, try filtering the data to display only those you need to create your map.
  For example, if you have a dataset of communes in France and you only need communes from one département, filter the data (using Magrit's selection feature) to keep only communes from that département.

The Magrit development team is also working on improving the application's display performance and proposing solutions for managing larger datasets.
