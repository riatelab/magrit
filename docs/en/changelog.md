# Changelog

<br />

::: tip Note

Magrit does not strictly follow the rules of *semantic versioning* (in the form *major*.*minor*.*patch*), but focuses on changes that are directly visible to application users:

- a *major* version (**a**.b.c) for each major redesign of the application (involving, for example, incompatible project files - this has only happened once since 2017),
- a *minor* version (a.**b**.c) for significant additions (new representation functionality, etc.),
- a *patch* version (a.b.**c**) for bug fixes and additions of minor functionalities (addition of an option within an existing representation or analysis functionality, etc.).

:::

#### 2.3.7 (2025-07-29)

- Improve SVG export so that different groups are detected as layers in Inkscape (fixes <a href="https://github.com/riatelab/magrit/issues/160">issue 160</a>).

- Add an identifier to the various SVG groups containing layout elements (lines/arrows, free text elements, etc.) to make them easier to identify in Inkscape.

- Fix some missing translations in the link map editing modal.

#### 2.3.6 (2025-07-15)

- Rename the “Wagner” projection to “Wagner7” and enable its use (fixes <a href="https://github.com/riatelab/magrit/issues/157">issue 157</a>).

- Fix bar chart display for categorical choropleth maps containing null/empty values.

- Fix bar chart sorting for categorical choropleth maps.

#### 2.3.5 (2025-06-19)

- Fix launching of the desktop version with Electron on Linux (cf. https://github.com/electron/electron/issues/46538).

- Improve various minor stuff in SVG exports:

  * add an ID to the margin around the map if any,
  * remove invisible rectangle box under legend elements when this box is transparent (it is kept for when user adds a background color to the legend).

- Fix selection by attribute when the field contains null / missing values.

- Improve documentation about the SQL syntax to use to select features with null / missing values.

- Manually add `REGION_UN` and `SUBREGION_UN` for the features of the `world_209` dataset
  for which it was missing (Macao, Hong Kong, Western Sahara, Kosovo and Antarctica) in order
  to help selection of region / subregion.

- Improve support for importing CSV files where numbers use a comma as decimal separator.


#### 2.3.4 (2025-06-10)

- Improve normalization function in join modal to also take into account punctuation characters when normalizing values.

#### 2.3.3 (2025-06-02)

- Improve the join creation modal, in particular by showing entries that have not found a match and by allowing
  normalization of the values taken into account on both sides to make the join
  (fixes <a href="https://github.com/riatelab/magrit/issues/155">issue 155</a>).

- Enhance the size of the scale bar when it's created so that its distance is “pretty” (1 km, 2 km, 5 km, 10 km, 50 km, etc.),
  while aiming for a scale bar close to 100px wide.

- Improve the behavior of the “free drawing” layout feature
  (by removing temporary lines as soon as the cursor is released and by not adding lines composed of a single point).

- Improve the precision of class boundaries for smoothed maps (especially when using a divisor variable).

#### 2.3.2 (2025-05-19)

- Replace the use of [gdal3.js](https://github.com/bugra9/gdal3.js) by the use of [geoimport](https://github.com/riatelab/geoimport) (a high-level wrapper around gdal3.js) to handle the import/export of the various file formats.

- Replaces the use of `feDropShadow` with the use of `feFlood`, `feGaussianBlur` and `feOffset` to create drop shadows on SVG elements (to improve compatibility with SVG editors including Inkscape - fixes <a href="https://github.com/riatelab/magrit/issues/154">issue 154</a>)

- Add support for OGC WKT 2 string for defining custom projections.

#### 2.3.1 (2025-04-24)

- Fix display of coordinate system code when authority is “ESRI” and not “EPSG” (fixes <a href="https://github.com/riatelab/magrit/issues/152">152</a>).

#### 2.3.0 (2025-03-21)

- Add an option to specify, for representations using classification, whether classes are closed “on the left” or “on the right”.
  This is a significant change, since classes were previously closed *on the right* and are now closed *on the left* by default.
  See the [classification documentation page](./functionalities/classification) for more information on this subject.

- Enhance tooltips (when hovering over a layer in the layer manager) to display detailed information about the layer.

- Fix a bug when opening XLSX files where the header line was not detected correctly and appeared as the first line of data (cf. discussion in <a href="https://github.com/riatelab/magrit/issues/143">issue 143</a>).

- Improve support for CSV files containing empty rows and/or columns (cf. discussion in <a href="https://github.com/riatelab/magrit/issues/143">issue 143</a>).

- Minor fixes in Spanish translation.

#### 2.2.5 (2025-03-03)

- Modify the option to control whether the class summary chart is displayed in the layer settings modal (fixes <a href="https://github.com/riatelab/magrit/issues/149">149</a>).

- Added missing options in the layer settings modal:
  - to change the color of proportional symbols in the “positive values / negative values” coloring mode,
  - to control the display of the scatterplot of linear regression results (as for the chart of class summaries, following fix of <a href="https://github.com/riatelab/magrit/issues/149">149</a>).

### 2.2.4 (2025-02-24)

- Update *world_209* dataset to add `NAMEde` column for German country names and
  to update the column `REGION_BLOC` with the countries that have left CEDEAO/ECOWAS (Burkina Faso, Mali and Niger, on 25/01/2025).

#### 2.2.3 (2025-02-17)

- Fixes the standard deviation calculation in the classification panel (both for class calculation with the “Standard deviation” method and for the display of standard deviations on the chart).

- Changes the way class boundaries fall for “Fisher-Jenks” classification (they now fall on the midpoint between data values rather than on the values themselves).

#### 2.2.2 (2025-02-12)

- Remove support for XLS files (XLSX and ODS files are still supported - fixes <a href="https://github.com/riatelab/magrit/issues/148">148</a>).

#### 2.2.1 (2025-01-20)

- Add some d3-geo projections that were missing (Conic Conformal, Conic Equal-Area, Conic Equidistant, Gnomonic, Transverse Mercator).

- Improve the component for defining standard parallels for projections that support this parameter.

- Fix the redrawing of the map (wasn't happening) when changing the standard parallel(s) of a projection.

#### 2.2.0 (2025-01-06)

-  New: Add the translation of the interface in Spanish (thanks to [@cvbrandoe](https://github.com/cvbrandoe)).

#### 2.1.3 (2024-12-18)

- Fix the rendering of categorical pictogram maps for features with no value
  (it now don't display a pictogram for these features instead of displaying a default symbol).

#### 2.1.2 (2024-12-09)

- Add the possibility of creating graduated links (size according to class after classification) in addition to proportional links
  and fixed-size links (the option was indicated as existing in the documentation but was not proposed in the interface).

- Add a minimum size for proportional links (to ease the visualization of links with very small values).

- Fix the option to manually move proportional symbols after the “avoid overlapping symbols” option has been enabled then disabled (fixes <a href="https://github.com/riatelab/magrit/issues/147">147</a>).

- Don't propose to move proportional symbols while the "avoid overlapping symbols" is enabled (fixes <a href="https://github.com/riatelab/magrit/issues/147">147</a>).

#### 2.1.1 (2024-11-21)

- Deactivate “Undo/Redo” functionality by default to improve performance.

- Improve first draw performance in geometry simplification modal.

#### 2.1.0 (2024-11-15)

- Add a new portrayal type: "Waffle map" (Fixes <a href=“https://github.com/riatelab/magrit/issues/132”>132</a>).

- Add support for importing zipped datasets (zip files containing a single dataset or multiple datasets).

- Fix filtering empty lines on CSV datasets for which the line separator is `\r\n`.

- Fix buttons in FormulaInput component when the field name is also a sql function name (such as `count` or `sum`).

- Update FAQ in documentation.

#### 2.0.19 (2024-10-22)

- Improve rendering of bar chart legend element used for categorical choropleth maps.

- Improve classification panel:
  - by allowing the user to choose custom palette colors (by manually choosing the color for each class),
  - by allowing the user to copy / paste palette colors (to easily reuse the same palette in another project / in another map),
  - by offering a class number selector dedicated to nested means (to allow only powers of 2 to be selected, fixes <a href=“https://github.com/riatelab/magrit/issues/145”>145</a>),
  - by improving the comparison functions for classes boundaries given manually by the user. 

- Add a menu for selecting complete cartographic templates (composed of several layers) in the window for example datasets.

- Add map templates for France and Europe (Template design, data retrieval and preparation, etc. all by [@rysebaert](https://github.com/rysebaert)).

- Fix moving of legends / labels / layout features on touch screens (fixes <a href="https://github.com/riatelab/magrit/issues/146">146</a>).

- Fix the use of some SQL functions in the field calculator when null values are present.

#### 2.0.18 (2024-10-10)

- Fix a field typing issue when importing a CSV file for fields containing numeric values with zeros and NA, introduced in 2.0.16
  (Fixes <a href=“https://github.com/riatelab/magrit/issues/143”>143</a>).

#### 2.0.17 (2024-10-10)

- Fix a bug, not fully fixed previously, on the redrawing of mushrooms when changing the reference size of a semicircle.

- Improve documentation to keep it up to date with the latest changes.

- Fix a spacing issue on link legends (vertical version).

#### 2.0.16 (2024-10-09)

- Improve classification panel:
  - by refactoring the component to input manual breaks,
  - by adding some space between radio buttons for msd classification,
  - by allowing to easily copy / paste the break values,
  - by fixing the bug where the dropdown menus (for palettes and classification methods) are not visible (especially on Edge and with small screens).

- Add new datasets of French municipalities split by Région (thanks to [@rysebaert](https://github.com/rysebaert)).

- Fix bug with scale bar when changing the distance unit.

- Fix clipping extent for some EPSG projections (and add an experimental option to disable clipping).

- Don't use unnecessary `clip-path` on SVG elements when the projection doesn't come from d3
  (in order to fix a layer visibility issue when opening the resulting SVG in Adobe Illustrator).

- Fix performance issues when changing some properties of layout features (by not pushing each change in the undo/redo stack, as an undo button cancels all modifications made in the modal).

- Fix some auto-typing issue when importing a CSV dataset (where identifiers like "01004" where sometimes incorrectly casted to numbers).

#### 2.0.15 (2024-09-30)

- Replace internal ids with layer names in the `id` attribute of SVG elements
  to make it easier for SVG export users to identify layers (fixes <a href="https://github.com/riatelab/magrit/issues/141">141</a>).

- Improves performance when editing text annotations (and map title and source fields) by not saving every change in the application history (the undo/redo stack).

- Update NUTS2 datasets (thanks to [@rysebaert](https://github.com/rysebaert)).

#### 2.0.14 (2024-09-25)

- Fix manual category sorting for categorical choropleth and pictogram maps when the dataset contains null or empty values.

- Improves initial category sorting for categorical choropleth and pictogram maps.

#### 2.0.13 (2024-09-23)

- Fix the lack of verification before alerting the user to an incompatible field type when creating a new column.

- Improve handling of `Infinity` and `NaN` values when creating a new column.

- Add a video to the documentation.

#### 2.0.12 (2024-09-17)

- Fix mushrooms map legend update after the reference size of a half-circle has changed.

- Fix the position of mushrooms on the map when a half-circle reference size is changed.

- Fix the position of scale bar text when choosing a scale bar without side ticks.

- Improve the choice of types offered in the field typing modal and checks the type chosen by the user when creating a new column.

- Improve the behavior of the “Zoom to layer” feature to take into account any margins added by the user around the map.

- Improve support for small values in the zoom factor options in the left side menu.

- Add a tutorial to the documentation.

#### 2.0.11 (2024-09-13)

- Fix support for importing files whose mime-type was not detected on Windows (KML and Geopackage in particular).

- Fix the display order of entities on mushroom maps.

- Fix export of layers to Shapefile and GeoPackage.

#### 2.0.10 (2024-09-11)

- Minor fixes in french translation.

- Restore functionality to represent stock variables with negative values other than
  with 2 colors representing positive and negative values (i.e. with a qualitative variable or
  with a relative quantitative variable when present in the dataset).

#### 2.0.9 (2024-09-05)

- New functionality to select numerator / denominator for smoothed maps (Fixes <a href=“https://github.com/riatelab/magrit/issues/135”>135</a>)

- Add options for choosing whether or not to display the confidence interval around the linear regression line and, if so, its color.

- Improves import of CSV files:
  - by removing "NA" values from numerical columns and replacing them with null values,
  - by removing any empty lines at the end of the file.

- Add a new entry in the left menu to change the scale and translate attributes of the map.

- Add a vertical scroll bar in the layer manager (rather than on the whole left menu) for when a project contains many layers.

- Add an example dataset “Countries of the world” with various statistical data (from the World Bank, the United Nations and Wikipedia).

- Add the ability to choose text color and other font settings for scale bars.

- Add the ability to choose the color of the north arrow (in its “simple” style only).

#### 2.0.8 (2024-08-27)

- Corrected the value displayed for scale bars (Fixes <a href=“https://github.com/riatelab/magrit/issues/137”>137</a>).

- Add functionality to directly reload a project file from a remote URL (see documentation for details).

- Disable the button to open the import window until GDAL has finished loading.

#### 2.0.7 (2024-07-31)

- Reintroduce the publishing of an image on the Docker Hub with each new release.

- Add the ability to define a custom projection via a WKT or proj4 chain (Fix <a href=“https://github.com/riatelab/magrit/issues/133”>133</a>).

- Enhance components for modifying projection axis parameters (to enable more precise input of values).

#### 2.0.6 (2024-07-12)

- Add functionality to display the mean, median and population on the histogram displayed on the map for choropleth representations.

- New example datasets added by [@rysebaert](https://github.com/rysebaert):
  - Municipalities of Metropolitan France,
  - Municipalities of Metropolitan France + overseas regions,
  - Municipalities of Metropolitan France + overseas regions in inserts (to enable easy representation of mainland France + overseas regions in the same map).

#### 2.0.5 (2024-07-10)

- Fix bug with mean & standard deviation classification method (when the average is requested to be a class limit). Fixed upstream
  in [mthh/statsbreaks](https://github.com/mthh/statsbreaks).

- Enable displaying population (rug plot) on the classification plot of the classification panel.

- Improves the color of the box plot (especially when using the dark theme) in the classification panel.

- Changed the links to the old version of Magrit in the documentation.



#### 2.0.4 (2024-07-08)

- Fix the topology of NUTS example datasets (partially fixes <a href="https://github.com/riatelab/magrit/issues/127">127</a>) and associated metadata.

- Better handling of null geometries after intersection when creating grids (partially fixes <a href="https://github.com/riatelab/magrit/issues/127">127</a>).

- Improved the first rendering of the application (this time the problem should be solved).

#### 2.0.3 (2024-07-05)

- Still improve the rendering of the app after the stylesheet has loaded.

#### 2.0.2 (2024-07-05)

- Render the app after the stylesheet has loaded (to avoid flash of unstyled content).

#### 2.0.1 (2024-07-05)

- Fix some typos / bad phrasing in french translation.
- Fix zooming / scale when adding an example dataset and when it is the first layer added to the application
  (Fixes <a href="https://github.com/riatelab/magrit/issues/128">128</a>).
- Change the name of the special field `$length` to `$count` in the SQL-like formula component
  (Fixes <a href="https://github.com/riatelab/magrit/issues/130">130</a>).

### 2.0.0 (2024-07-04)

This is a complete overhaul of the application (in terms of both architecture and user interface).
The exact list of changes is too long to be explicitly listed here, but here are a few highlights:

- New user interface (dark theme, etc.)
- New architecture (use of Solid.js, no more Python server: all operations are performed in the browser)
- New functionalities (aggregation, selection, simplification, KDE, linear regression, etc.)
- The ability to download a stand-alone version of the application (without needing an Internet connection to use it)

The features of the previous version of Magrit are still available
(the various portrayal types, PNG / SVG export, project file export, etc.).

---


#### 0.16.6 (2024-06-03)

- Update homepage.

#### 0.16.5 (2024-05-04)

- Update ``aiohttp`` dependency to fix some security issues.

#### 0.16.4 (2024-03-20)

- Fix some links to documentation for when used in docker (cf. discussion in #115).

- Better wording for error message in join modal (fix #123).

- Fix alignment of items (within each row) in color selection panel for categories.

#### 0.16.3 (2023-07-12)

- Fix saving the custom palette when clicking on confirm in the dedicated popup of the discretisation panel (fixes #117).

- Improves the size of some HTML elements for custom palettes that were too small.

- Fix field names vertical alignment in label creation options (thanks to @robLittiere).

- Fix overflow of field names in label creation options (thanks to @robLittiere).

- Don't try to rewind automatically cartogram layers.

- Remove useless CSS from 404 page (which included loading a font from Google Fonts).

#### 0.16.2 (2023-05-12)

- Fix red dot position for labels when moving them.

#### 0.16.1 (2023-05-11)

- Improve compatibility between the slightly new handling of the label position and the old handling of the label position (when loading a project file created with a version before 0.16.0).

#### 0.16.0 (2023-05-11)

- Deactivate zoom by rectangular selection when changing projection if its on.

- Improve the handling of the label positions by avoiding to reset the position of the labels when changing projection for labels that have been manually moved.

- Avoid resetting the position of the labels when exporting to SVG with the "Clip SVG on current extent" option.

- Change CSS for inactive layers (because Inkscape does not support the "visibility" attribute on SVG elements nor the "visibility" CSS property).

- Load pictograms when loading the application instead of deferring the loading to the first time the "pictogram panel" is opened (it was causing some issues with slow network connections, because pictograms were not loaded when the user was trying to use them - see #110).

#### 0.15.3 (2023-04-14)

- Fix links to image from subchapters in documentation.

#### 0.15.2 (2023-04-13)

- Fix the mouseup behaviour when drawing a rectangle layout feature (the cursor was still moving the map after drawing the rectangle even after the click was released).

- Fix the mouseup behaviour when zooming with a rectangular selection (the cursor was still moving the map after drawing the rectangle even after the click was released).

#### 0.15.1 (2023-04-11)

- Transfers the fill-opacity of layers to their legends.

#### 0.15.0 (2023-04-06)

- Fix bug with null / empty geometry introduced in commit 326e3c8 / version 0.13.2.

- Improve the label creation popup to enable the creation of multiple labels at once, while being able to select the font and the font size for each field.

- Automatically stack labels for the same feature to avoid overlap (thanks to @robLittiere and @ArmelVidali / see PR #109).

- Update ``smoomapy`` dependency to fix some issue when bounds given by the user are very close to the min/max bounds of the data (and that could result in a class without value).

#### 0.14.1 (2023-03-29)

- Fix the location of labels derived from a dorling/demers (proportional symbol) layer (Fix #108). Also works on symbols that were manually moved.

- Fix description of Departements and Regions sample dataset ("CODGEO" field was described as "CODEGEO", preventing to use the actual "CODGEO" field in some representations).

#### 0.14.0 (2023-03-24)

- New: Enables the filtering of one or more categories of symbols when rendering a Typo Symbol map (thanks to @robLittiere and @ArmelVidali / see PR #106)

- New: Add the possibility to create legend for label layers. Closes #107.

- Fix some typos in french translation.


#### 0.13.4 (2023-03-14)

- Change docker recipe to enable the creation and the publication on docker hub of multi-platform images (amd64 / arm64).

#### 0.13.3 (2023-02-21)

- Try to improve rings rewinding since some existing issues weren't solved (#104) and since some new issues have arisen (#105).

- Fig a bug preventing to load target layers that don't have any attribute field.

#### 0.13.2 (2023-02-17)

- Rewind rings of polygons before displaying layers in the map (to avoid some rendering issues with some geometries and d3.js).

#### 0.13.1 (2023-01-05)

- Update go-cart-wasm version to 0.3.0 (avoid infinite loop on some edge cases).

- Remove some deprecation warning when reprojecting some geometries in Python code.

- Improve how to overlay disappears if an error is encountered during Gastner, Seguy and More cartogram creation.

#### 0.13.0 (2023-01-04)

- Fix bug that was preventing to do some new cartographic portrayals after promoting a layout layer to target layer.

- New: Add option to use Gastner, Seguy and More (2018) method to compute cartograms (only available in browsers that support WASM).


#### 0.12.1 (2022-12-06)

- Fix an apparently old bug about reloading of old project files (project file generated around 2017 that did not yet contain version information, before 0.3.0, so probably only very few people / project files were affected).

- Fix importing of geopackage when clicking on the "Add a basemap" button (was only working when dropping geopackage files on the map).

#### 0.12.0 (2022-11-30)-

- New: Enable the import of vector layers contained in geopackages.

- Fix missing HTML attribute that prevented re-translation of some tooltip.

- Fix coordinate order when exporting to some CRS / file formats.

- Improves the positioning of the legend titles for proportional symbols.

- Improve the alignment of the items in the legend edition box.

- Update Python dependencies to enable Python 3.11 support and switch to Python 3.11 in all docker images (Python 3.11 is supposed to bring interesting performance improvements thanks to the specialization brought by its adaptive interpreter)


#### 0.11.1 (2022-11-08)-

- Fix missing i18n strings for projections added in 0.11.0.

#### 0.11.0 (2022-11-03)-

- New: Add option to avoid overlapping of the circle / square symbols (in PropSymbol, PropSymbolChoro and PropSymbolTypo). Closes #77.

- Update cartographic templates that are available on the landing page (thanks to @rysebaert for preparing the data and providing the templates).

- Update NUTS datasets to 2020 version.

- Update of datasets for Metropolitan France to a version based on voronoi polygons calculated from the centroids of the communes of the ADMIN-EXPRESS-COG 2022 version.

- Add new cartographic projections from d3-geo-projection : *Interrupted Quartic Authalic*, *Interrupted Mollweide Hemispheres*, *PolyHedral Butterfly*, *Polyhedral Collignon*, *Polyhedral Waterman*, *Hammer*, *Eckert-Greifendorff* (based on `d3.geoHammer`), *Quartic Authalic* (based on `d3.geoHammer`) and *Spilhaus* (based on `d3.geoStereographic`).


#### 0.10.1 (2022-10-13)

- Fixed a bug that prevented to create typology maps (Typo, PropSymbolTypo and TypoPicto) with data of type 'Number' (error introduced in version 0.10.0).


#### 0.10.0 (2022-10-07)

- Change how is proposed the 'custom palette' option in the classification panel (#78).

- Improve CSS of the classification panel.

- Improve the rendering of the histogram in the classification panel.

- Sort alphabetically categories of 'typo' and 'picto' by default.

- Improve positioning of the waffles in Waffle Map (so that the center of the waffle block falls on the x-center, instead of the behavior until now where it was the lower right corner).

- Enforce parsing fields as string in GML file (following bug report by email).

- Read the CRS of the GML file to transfer it to the UI and ask the user if it should be used.

- Fix coordinates order (using OAMS_TRADITIONAL_GIS_ORDER option of OSR) when exporting to Shapefile and GML.

- In PropSymbolTypo, do not show in the legend the categories that do not appear on the map because of empty or 0 values in the field used to draw the proportional symbol (#93).

- Update some country names in "World countries" example dataset (PR #92 by @rCarto).

- Update the whole `d3.js` stack.

#### 0.9.2 (2022-09-08)

- Fix positioning of the waffles in Waffle Map (#87).


#### 0.9.1 (2022-08-31)

- Fix repositioning of the labels after reloading project file if they were manually displaced (#86).


#### 0.9.0 (2022-08-31)

- Implement text buffer for label layers (#79).

- Improve the rendering of all the text buffer (title, text annotation and label layer) by using `stroke`, `stroke-width` and `paint-order` attributes.

- Improve the detection of the current font when reopening style popup for title and text annotation.

- Fix import of `xlsx` files (#85).


#### 0.8.15 (2022-08-26)

- Allow to export CSV table (#75).

- Fix legend not visible on proportional links map on Firefox (#74).

- Fix positioning of symbols and labels when centroid doesn't fall inside the target polygon (it now tries to compute the inaccessibility pole or if it still doesn't find a point in the polygon, the closest point to the centroid on the edge of the polygon) (#63).

- Update many dependencies to ease the installation with recent Python (such as 3.10) on a recent system (such as ubuntu 22.04).

- Update Docker recipes.

- Update the documentation about the possibility to change the role (target / layout) of the layers in the interface (#36).

- Correctly update the count of layout layers (#82).

- Fix some typos in french and English translations.

- Improve the style of some buttons (they weren't readable when they were in "hover" state).

- Improve the style of the "layer style" popups (elements were not properly aligned) and of the "layout feature style" popups.


#### 0.8.14 (2022-03-16)

- Fix wrong usage of `concurrent.futures.ProcessPoolExecutor` + kill possibly long running computation after 5min (such as computing smoothed map and gridded map).

- Update some python dependencies.

- Change logo, contact email and name of UAR RIATE + Fixes in documentation.


#### 0.8.13 (2020-11-27)

- Replace `cascaded_union` with `unary_union` in Python code and attempt to handle input geometries with errors.

- Shape-rendering attributes when creating smoothed maps.


#### 0.8.12 (2020-11-26)

- Allow more flexibility to customize the set of sample layers to use when deploying Magrit (#45).

- Fixe some typos in documentation (#49).

- Render crisp-edges (ie. disable SVG antialiasing) if the stroke-width or the stroke-opacity of a layer is set to 0 (#61). Note that this has an impact on the quality of the rendering, which is now slightly crenellated.

- Avoid opening the overlay (dedicated to file upload and triggered by a drag event) when dragging html elements (#64).

- Correctly set the "lang" HTML attribute to avoid having chrome translation popping up when it is not necessary (#65).

- Improves the retrieval of a useful error message in case of failed conversion of tabular file.

- Avoid to propose to reuse the style of an existing categorical layer when there is only one.

- Improves the experience of reordering modalities for categorical layer / harmonize style between the modal window doing this for categorical layer and for picto layer (related to #62).


#### 0.8.11 (2019-03-20)

- Allow to specify the address to use to create the server.

- Fix join operation when using a webworker (should fix #38).

- Replace some absolute paths at forgotten places.

- Bump webpack / webpack-cli version.

- Fix a misalignment in the fill color section in the layer style dialog (for layout layers).

- Fix the size of the two input ranges in the north arrow properties dialog and remove the duplicated title.

- Fix the initial value of the range input for border opacity in smoothed map properties dialog.

- Fix the width of the single symbol properties dialog (so it has the same size of arrow/ellipse/etc. dialog).

- Fix alignment of elements in jointure dialog (and space more evenly the elements).

- Add some margin/padding to the elements in the classification dialog (when using 'diverging palette' option).

- Fix many recurring typos in French (selection -> sélection; fleche -> flèche; charactère -> caractère) and in English (Proportionnal -> Proportional).


#### 0.8.10 (2018-11-22)


- Fix typo on documentation and french interface with *semis* de point. (#32)

- Fix incorrect 'REVENUS' and 'REVENUS_PAR_MENAGE' values on Grand Paris dataset. (#33)

- Fix bug with the displaying of information on table dialog in french interface (such as "20 entrées par page"). (#29)

- Start gunicorn with some "max-requests" value to automatically restart the workers and minimize the potential memory leak impact.

- Fix bug with 'reverse palette' button on smoothed map properties dialog. (#31)


#### 0.8.9 (2018-10-15)

- Fix bug with translation on index page.

- Remove the old contact form in favor of the contact form of RIATE website.


#### 0.8.8 (2018-09-21)

- New: Change the index page to display some cartographic templates.

- Fix bug with map title properties dialog opening.


#### 0.8.7 (2018-09-10)

- New: Allow to clip the SVG export to the currently displayed extent.


#### 0.8.6 (2018-08-08)

- Improve symbols positioning in waffle map legends.

- Improve the tests suite.

- Update some examples in documentation (notably to use Lambert-93 projection on some Paris map).


#### 0.8.5 (2018-07-02)

- New: Allow to create a legend also for layout layers.

- New: Display a message before promoting/downgrading a layer to/from the status of target layer.

- Fix layer projection before computing Dougenik cartograms.

- Fix unexpected GeoJSON file also present in zip archive when exporting to shapefile.

- Fix incorrect behavior when editing scalebar properties (+ fix the behavior of the its cancel button).


#### 0.8.4 (2018-06-08)

- Fix silly syntax error.


#### 0.8.3 (2018-06-08)

- Fix error while getting temporary filename on some functions.


#### 0.8.2 (2018-06-07)

- Fix height of svg chart for values classification for links and discontinuities.

- Internal modifications to allow local use of the server application without redis (and possibly easier installation/use on windows).


#### 0.8.1 (2018-05-22)

- Fix the displaying of bar chart in classification panel.


#### 0.8.0 (2018-05-22)

- New: Allow to promote layout layers (or some result layers) to be a target layer. This functionality makes it possible to combine some representations more efficiently and more quickly (for example, making a chroropleth map on the result of an anamorphosis, etc.).

- Change how are imported target/layout layers: a message asking whether the newly imported layer is a target layer or a layout layer ?

- Fix position of context menu when opened on layout features located on near the right/bottom of the window.

- Try to improve the style of the box asking to type the various fields of the layer.

- Change the workflow to prepare JS code (now using *webpack*) / split JS code in more files / don't use Jinja2 server-side anymore.


#### 0.7.4 (2018-04-18)

- Prevent some error when opening layer with non unique entries in field named 'id' (internally caused by the fact we use geojson and fiona is failing on opening geojson with duplicates in that field).


#### 0.7.3 (2018-03-21)

- Multiple small bug fixes related to styles.

- Fix badly set value on some input range elements.


#### 0.7.2 (2018-03-19)

- Removes arithmetic progression classification method.

- Also allow to create proportional symbols map when analyzing a layer of points.

- Allow to use rounded corners on rectangles available as layout features.

- Slightly change the behavior when a result layer is added by not fitting anymore the viewport on it.

- Fix the "fit-zoom" behavior when using Armadillo projection and a layer at world scale.

- Change the Stewart implementation to consume less memory (smoomapy package is dropped temporarily).


#### 0.7.1 (2018-03-09)

- Fix typos in documentation.

- Add a new option for proportional symbols legends, allowing to display a line between the symbol and the value.

- Enable the (still experimental) auto-alignment feature for text annotation.


#### 0.7.0 (2018-03-05)

- New: allow to analyze a layer of points by two means : through a regular grid or through an existing layer of polygons. Informations computed are either the density of items (weighted or not) in each cell/polygon or a statistical summary (mean or standard deviation) about the items belonging to each cell/polygon.


#### 0.6.7 (2018-02-01)

- Fix links creation on some cases when using integers as identifiers.


#### 0.6.6 (2018-01-19)

- Fix/improve some styling options in links menu and in links classification box.

- Fix error occurring on labels creation when using a target layer with empty geometries and warn the user if it's the case (as for the other representations).


#### 0.6.5 (2018-01-12)

- Be more tolerant with in the regular expression used to filter the name of exported maps (by allowing dot, dash and parentheses for example).

- Fix the displaying of the "waiting" overlay when loading a TopoJSON layer.

- Fix the displaying of the "horizontal layout" option for legend when used on a categorical choropleth map + rounding precision for "horizontal layout" legend and "proportional symbols" legend.

- Fix bug when changing layer name when using particularly long names.

- Compute Jenks natural breaks in a web worker if the dataset contains more than 7500 features.


#### 0.6.4 (2017-12-22)

- Slightly change how field type is determined.

- Try to improve the 'active'/'pushed' effect on buttons located on the bottom-right of the map.

- Try to be lighter on the use of memory (by reducing the TTL of redis entries and by not saving (for later reuse) intermediate results anymore when computing potentials).

- Explicitly set locale and language parameters on docker image and make a better sanitizing of layer names.


#### 0.6.3 (2017-12-14)

- Fix encoding issue of some sample basemaps (introduced in 0.6.1).

- Fix some errors that appeared when loading some datasets (especially while converting a csv to geojson when some cells of the coordinate columns contains weird stuff).

- Fix error with line height on text annotation with custom font when reloading a project file.


#### 0.6.2 (2017-12-12)

- Fix bug when importing shapefiles (due to wrong hash computation / was introduced in 0.6.1).


#### 0.6.1 (2017-12-11)

- New: add a new kind of layout for legends in use for choropleth maps.

- New: allow to create labels according to the values of a given field (such as creating "Name" labels only for cities with larger "Population" than xxx)

- Fix some bugs occurring while loading user files and improve the support for tabular file containing coordinates.

- Fix some typos in the interface and improve the displaying of the projection name when the projection is coming from a proj.4 string.

- Slightly improve support for Edge and Safari.


#### 0.6.0 (2017-11-29)

- New: ask the user if he wants to remove the un-joined features from his basemap (after a partial join).

- New: allow to make proportional links (ie. without data classification, only graduated links were available until now).

- New: add some new basemaps for France.


#### 0.5.7 (2017-11-08)

- Fix minors typo in french translation.

- Fix bug preventing to modify the number of class when using a diverging classification scheme.


#### 0.5.6 (2017-10-31)

- Fix bug with projection rotation properties not applied when reloading a project file.


#### 0.5.5 (2017-10-12)

- Fix bug with pictogram displaying in the appropriate box.


#### 0.5.4 (2017-10-01)

- Change the default font used in text/tspan SVG elements (in favor of verdana). Should fix (for real this time?) the bug occurring while trying to open the resulting SVG file with some software on systems where the font in use is not available (notably Adobe Illustrator v16.0 CS6 on MacOSX).

- Disable the ability to use sphere and graticule with lambert conic conformal projection (the generated path, which is currently not clipped when using Proj4 projections, could be very heavy due to the conical nature of the projection).

- Allow to cancel the ongoing addition of a layout item by pressing Esc (and so inform the user about that in the notification).

- Improve the legend for proportional symbols (only for "single color" ones) by also using the stroke color of the result layer in the legend.

- Add "Bertin 1953" projection to the list of available projections.


#### 0.5.3 (2017-09-22)

- Change the default font used in text/tspan SVG elements (in favor of Arial). Should fix the bug occurring while trying to open the resulting SVG file with some software on systems where the font in use is not available (notably Adobe Illustrator v16.0 CS6 on MacOSX).


#### 0.5.2 (2017-09-13)

- Fix graticule style edition.


#### 0.5.1 (2017-09-08)

- Improve how rectangles are drawn and edited.

- Fix the tooltip displaying proj.4 string.

- Allow to select projection from EPSG code and display it's name in the menu.

- Allow to reuse the colors and labels from an existing categorical layer.

- Change the layout of the box displaying the table.


#### 0.5.0 (2017-08-24)

- Allow to create, use (and re-use) custom palette for choropleth maps.

- Allow to hide/display the head of arrows.

- Notable change: some old project-files may no longer be loaded correctly (the impact is really quite limited, but precisely, the overlay order of layout features could be incorrect when opening these old project-files).

- Fix error with legend customization box after changing the layer name.

- Re-allow to display the table of the joined dataset and improve the table layout.

- Improve handling of fields containing mixed numerical and not numerical values for some representations.


#### 0.4.1 (2017-08-14)

- Fix background color when exporting to svg.

- Fix property box not opening on pictograms layer.

- Don't apply clipping path to pictograms layers nor symbols layers.

- Change the overlay displayed when a layer is loading.


#### 0.4.0 (2017-07-24)

- Fix error occurring on some representations when using a target layer with empty geometries and warn the user if it's the case.

- Introduce a new representation, waffle map, for mapping two (or more) comparable stocks together.


#### 0.3.7 (2017-07-17)

- Fix error on jointure.

- Fix location of red square when moving proportional symbols.

- Fix legend size on links and discontinuities when zooming.


#### 0.3.6 (2017-06-30)

- Fix selection on links map (was only working with specific field name).


#### 0.3.5 (2017-06-28)

- Allow to edit the location of proportional symbols

- Slightly change the behavior with proj4 projections when layers are added/removed


#### 0.3.4 (2017-06-22)

- Fix the "auto-align" feature behavior for the new text annotation.

- Fix graticule not showing correctly when opening result svg file with Adobe Illustrator.

- Fix the jointure failing since 0.3.3.

- New: Allow to change the name of the layers at any time.


#### 0.3.3 (2017-06-15)

- Allow to add more than one sphere background (#26).

- Add default projection for sample basemaps.


#### 0.3.2 (2017-06-09)

- Fix text annotation behavior when clicking on "cancel".

- Fix legend displaying "false" after reloading (when size was not fixed).

- Switch color between "OK" and "Cancel" buttons on modal box.


#### 0.3.1 (2017-06-08)

- Fix how values are retrieved for cartogram.


#### 0.3.0 (2017-06-07)

- CSV reading: fix the recognition of some encodings + fix the reading of files whose first column contains an empty name.

- Modifies text annotations (internally): now allows the selection of the alignment (left, center, right) of the text within the block.

- Modifies versioning to follow SemVer more strictly.

- Fix Lambert 93 projection, accessible from the menu of projections (the display was non-existent at certain levels of zoom with this projection).

- Removes two projections that could be considered redundant.

- Fix bug with choice of pictogram size.

- Fix bug in the order in which some features are reloaded from project file.