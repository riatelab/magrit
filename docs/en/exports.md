# Exports

Maps made in Magrit can be exported in SVG and PNG formats.

In addition, it is possible to export the geographic layers used to create the map in GeoJSON, Shapefile, KML, GML, TopoJSON, and GeoPackage formats.


## SVG Export

Exporting in SVG (Scalable Vector Graphics) format allows you to obtain a vector image
of the map created in Magrit, identical to what is displayed on the screen.

<ZoomImg
    src="/export-svg.png"
    alt="Export (SVG)"
    caption="Export component (format SVG)"
/>

If the "Clip SVG to current extent" option is selected (default behavior),
only the part of the map visible on the screen will be exported.
Otherwise, the entire map will be exported, including parts not visible on the screen.

## PNG Export

Exporting in PNG (Portable Network Graphics) format allows you to obtain a raster image (bitmap) of the map created in Magrit, identical to what is displayed on the screen.

<ZoomImg
    src="/export-png.png"
    alt="Export (PNG)"
    caption="Export component (format PNG)"
/>

By default, the height and width of the PNG image are defined (in pixels) based on the size of the map displayed on the screen.
If desired, you can specify a custom size for the PNG image by modifying the width and height values before exporting (for example, to obtain a higher quality image).

## Exporting Geographic Data

The various layers of geographic data used to create the map can be exported in several common formats: GeoJSON, Shapefile, KML, GML, TopoJSON, and GeoPackage.

<ZoomImg
    src="/export-geo.png"
    alt="Export (geographic layers)"
    caption="Export component (geographic layers)"
/>

For formats that allow it (including Shapefile, GML, and GeoPackage), you can choose the coordinate reference system (CRS) in which the data will be exported.
Several common CRSs are available in a drop-down list, but it is also possible to specify a custom CRS by entering either:
- an EPSG code (for example, `EPSG:2154` for RGF93 / Lambert-93),
- a WKT (Well-Known Text) definition,
- a Proj4 definition.

