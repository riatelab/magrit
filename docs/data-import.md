# Import des données

La fenêtre d'import des données s'ouvre automatiquement lorsque qu'un ou plusieurs fichiers
sont glissés et déposés dans la fenêtre de l'application. Il est également possible d'ouvrir
la fenêtre d'import des données à partir du menu latéral gauche, dans l'onglet "Import des données"
puis en cliquant sur "Ouvrir la fenêtre d'import des données...".

La fenêtre d'import des données permet de charger des fichiers de données géographiques (GeoPackage, Shapefile, GeoJSON, TopoJSON, KML, GML).
et des données tabulaires (XLS, XLSX, CSV, TSV, ODS).
Il est possible d'ajouter plusieurs fichiers à la fois en les sélectionnant dans la fenêtre de dialogue ou en les glissant et
déposant sur la fenêtre d'import des données.

<ZoomImg
    src="./img/data-import.png"
    alt="Fenêtre d'import des données"
    caption="Exemple : Fenêtre d'import des données avec 3 fichiers chargés (dont un GeoPackage contenant plusieurs couches)"
/>

Lorsqu'un format de fichier pouvant contenir plusieurs couches (GeoPackage ou TopoJSON) ou plusieurs tables (XLS, XLSX, ODS)
est chargé, une liste des couches ou tables est affichée dans la fenêtre d'import des données. Il est possible de sélectionner
une ou plusieurs couches / tables à importer en cochant les cases correspondantes.

## Données géographiques

Plusieurs informations sont reportées pour chaque couche de données géographiques chargée :

- nom de la couche
- nombre d'entités
- type de géométrie (point, ligne, polygone)
- système de coordonnées de référence (SCR)

Plusieurs fonctionnalités sont également activables :

- la possibilité d'utilisé la projection d'une couche de données pour l'ensemble du projet
- la possibilité de simplifier la géométrie des entités (utile pour les couches de données très détaillées - une fênetre s'ouvrira alors après validation de la fenêtre d'import des données pour choisir le niveau de simplification)
- la possibilité de zoomer sur une couche de données après son import


## Données tabulaires

Pour les données tabulaires, seuls le nom de la table et le nombre d'entités sont reportés.

Notez que les éventuelles formules présentent dans les fichiers de données tabulaires ne sont pas prises en compte lors de l'import.

## Validation de l'import

Une fois les couches / tables sélectionnées, il est possible de valider l'import en cliquant sur le bouton "Importer les *X* jeu(x) données".
