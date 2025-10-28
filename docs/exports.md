# Exports

Les cartes produites dans Magrit peuvent être exportées dans les formats SVG et PNG.

Par ailleurs, il est possible d'exporter les différentes couches de données utilisées pour créer la carte dans les formats GeoJSON, Shapefile, KML, GML, TopoJSON et GeoPackage.


## Export SVG

L'export au format SVG (Scalable Vector Graphics) permet d'obtenir une image vectorielle de la carte créée dans Magrit, à l'identique de ce qui est affiché à l'écran.

<ZoomImg
    src="/export-svg.png"
    alt="Export (SVG)"
    caption="Composant d'export (format SVG)"
/>

Si l'option "Découper le SVG sur l'emprise actuelle" est sélectionnée (comportement par défaut),
seule la partie de la carte visible à l'écran sera exportée.
Sinon, l'intégralité de la carte sera exportée, même les parties non visibles à l'écran.

## Export PNG

L'export au format PNG (Portable Network Graphics) permet d'obtenir une image matricielle (bitmap) de la carte créée dans Magrit, à l'identique de ce qui est affiché à l'écran.

<ZoomImg
    src="/export-png.png"
    alt="Export (PNG)"
    caption="Composant d'export (format PNG)"
/>

Par défaut, la hauteur et la largeur de l'image PNG sont définies (en pixels) en fonction de la taille de la carte affichée à l'écran.
Si vous le souhaitez, vous pouvez spécifier une taille personnalisée pour l'image PNG en modifiant les valeurs de largeur et de hauteur avant d'effectuer l'export (par exemple, pour obtenir une image de meilleure qualité).

## Export des données géographiques

Il est possible d'exporter les différentes couches de données géographiques utilisées pour créer la carte dans plusieurs formats courants : GeoJSON, Shapefile, KML, GML, TopoJSON et GeoPackage.

<ZoomImg
    src="/export-geo.png"
    alt="Export (couches géographiques)"
    caption="Composant d'export (couches géographiques)"
/>

Pour les formats qui le permettent (notamment Shapefile, GML et GeoPackage), il est possible de choisir le système de coordonnées de référence (SCR) dans lequel les données seront exportées.
Plusieurs SCR courants sont proposés dans une liste déroulante, mais il est également possible de spécifier un SCR personnalisé en entrant, au choix :
- un code EPSG (par exemple, `EPSG:2154` pour le RGF93 / Lambert-93),
- une définition WKT (Well-Known Text),
- une définition Proj4.

