# Data import

The data import window opens automatically when one or more files are dragged and dropped
into the application window.

The data import window can also be opened from the left-hand side menu, in the "Data import" tab, by clicking on "Open data import window...".

The data import window lets you load geographic data files
(GeoPackage, Shapefile, GeoJSON, TopoJSON, KML, GML) and tabular data (XLS, XLSX, CSV, TSV, ODS).

Multiple files can be added at once by selecting them in the dialog window or by dragging and dropping them onto the data import window.

<ZoomImg
    src="/data-import.png"
    alt="Data import window"
    caption="Example: Data import window with 3 loaded files (including a GeoPackage containing multiple layers)"
/>

When a file format that can contain multiple layers (GeoPackage or TopoJSON)
or tables (XLS, XLSX, ODS) is loaded, a list of layers or tables is displayed in
the data import window.
You can select one or more layers/tables to be imported by checking the corresponding boxes.


## Geographic data import

Several pieces of information are displayed for each geographic data layer loaded:

- layer name
- number of entities
- geometry type (point, line, polygon)
- reference coordinate system (RCS)

Several functionalities can also be activated:

- the ability to use the projection of a data layer for the entire project
- the ability to simplify the geometry of entities (useful for very detailed data layers - a window will open after validation of the data import window to choose the level of simplification)
- the ability to zoom in on a data layer after import


## Tabular data import

For tabular data, only the table name and the number of entities are reported.

Note that any formulas present in tabular data files are not taken into account during import.

## Validation of the import

Once the layers/tables have been selected, you can validate the import by clicking on the "Import *X* dataset(s)" button.
