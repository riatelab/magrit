# Jeux de données d'exemple

Plusieurs jeux de données d'exemple sont proposés dans Magrit.
Les données qu'ils contiennent ont été choisies afin de permettre de tester les différentes fonctionnalités de
représentation et d'analyse de l'application ; ces jeux de données n'ont toutefois pas vocation à couvrir
les différents besoins en fonds de carte ou en données thématiques des utilisateurs (des ressources permettant de 
trouver des jeux de données sont listés plus bas).

<ZoomImg
    src="/example-datasets.png"
    alt="Fenêtre de sélection des jeux de données d'exemple"
    caption="Fenêtre de sélection des jeux de données d'exemple"
/>

## Fonds de cartes proposés dans l'application

### NUTS0

Version 2016.

### NUTS1

Version 2016.

### NUTS2

Version 2016.

### NUTS2 (avec données Eurostat)

Version 2016.

### NUTS3

Version 2016.

### Pays du monde (version 209 pays - avec données Banque mondiale / Nations Unies / Wikipedia)

### Quartiers de la ville de Paris

### Communes de France métropolitaine

Édition 2023.

### Communes de France métropolitaine et DROM

Édition 2023.

### Communes de France métropolitaine et DROM (modèle cartographique)

Dans cette version les DROM sont rapprochés de la métropole afin de permettre une meilleure visualisation des données.

Édition 2023.

### Communes de France par région et DROM

Les communes, édition 2023, sont mises à disposition pour chacune des régions françaises et chacun des DROM.

## Templates cartographiques

Plusieurs templates cartographiques sont proposés dans Magrit. Il s'agit d'un ensemble de couches (fond de carte principal et couche d'habillage)
prêts à être utilisés pour la création de cartes thématiques sur une espace donné.

Deux premiers templates sont proposés et d'autres seront ajoutés dans les prochaines versions.

### Europe

Le template cartographique contient deux couches principales NUTS 2 et NUTS 3 ainsi que différentes couches d'habillage (pays voisins, capitales, boites, etc.).

Dans ce modèle, les territoires ultrapériphériques de l'Union européenne sont rapprochés de l'Europe continentale et disposés dans des boites pour une meilleure visualisation.

Le continent européen est représenté dans la projection cartographique de officiel de l'Union européenne (EPSG:3035).

<ZoomImg
    src="/eu_template.png"
    alt="Template cartographique pour l'Europe"
    caption="Template cartographique pour l'Europe"
/>

### France 

Le template contient une couche principale des communes de France métropolitaine et DROM ainsi que différentes couches d'habillage (pays voisins, boites, etc.).

Dans ce modèle, les départements et régions d'outre-mer sont rapprochés de la métropole et disposés dans des boites pour une meilleure visualisation.

La France métropolitaine est représentée dans la projection cartographique officielle (EPSG:2154).

<ZoomImg
    src="/fra_template.png"
    alt="Template cartographique pour la France"
    caption="Template cartographique pour la France"
/>

## Où trouver d'autres jeux de données ?

En fonction de l'échelle de travail, différents fournisseurs de données permettent le téléchargement de
fonds de cartes libres d'utilisation permettant par exemple la jointure d'un jeu de données dans Magrit.
On peut citer par exemple :

- [Natural Earth](https://www.naturalearthdata.com/) : données géographiques mondiales à différentes échelles,
- [GADM](https://gadm.org/) : données géographiques administratives mondiales,
- Données issues du projet [OpenStreetMap](https://www.openstreetmap.org/) : données géographiques mondiales collaboratives (ces données
  peuvent notamment être téléchargées, selon différentes emprises et thématiques, sur le site [Geofabrik](https://download.geofabrik.de/)),
- Données fournies par les instituts cartographiques ou statistiques nationaux :
  - [IGN](https://www.ign.fr/) : données géographiques nationales (France),
  - [INSEE](https://www.insee.fr/) : données statistiques nationales (France),
  - [Eurostat](https://ec.europa.eu/eurostat) : données statistiques européennes,
  - [US Census Bureau](https://www.census.gov/) : données statistiques américaines.

