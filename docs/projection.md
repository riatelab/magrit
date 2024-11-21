# Choix d'une projection cartographique

La projection cartographique est un élément essentiel de la cartographie.
Elle permet de représenter la surface de la Terre (que ce soit dans sa globalité ou qu'il s'agisse d'une petite portion du
territoire) sur un plan.
Il existe de nombreuses projections cartographiques, chacune ayant ses avantages et ses inconvénients.

Dans Magrit, la projection par défaut lors de l'ajout des données est la projection Natural Earth 2.

## Menu déroulant d'accès rapide aux projections


Il est possible de changer la projection de la carte dans la section "Configuration de la carte" située dans le menu de gauche : plusieurs
projections courantes sont proposées ainsi que la possibilité d'explorer toutes les projections disponibles dans Magrit.

<ZoomImg
    src="/projection-short-list.png"
    alt="Menu d'accès rapide aux projections"
    caption="Menu d'accès rapide aux projections"
/>

## Personnalisation des paramètres de la projection

Lors de l'utilisation d'une projection globale, il est généralement possible de gérer plusieurs paramètres de la projection :
- son centre (sur les axes λ, φ et γ)
- son ou ses parallèle(s) standard(s)

<ZoomImg
    src="/projection-detailed-params.png"
    alt="Paramètres d'une projection"
    caption="Personnalisation des paramètres d'une projection (ici la projection Wagner)"
/>

## Fenêtre de choix d'une projection

### Projection globale

Les projections globales sont des projections qui permettent généralement de représenter la Terre dans sa globalité (ou à l'échelle d'un continent).

Ces projections sont fournies par la bibliothèque logicielle [d3.js](https://d3js.org/).

<ZoomImg
    src="/projection-panel1.png"
    alt="Sélection d'une projection globale"
    caption="Sélection d'une projection globale"
/>

### Projection locale

Les projections locales sont des projections qui permettent de représenter une portion plus restreinte de la Terre (par exemple un pays, une région).

Ces projections sont fournies par la bibliothèque logicielle [proj4js](https://proj4js.org/) et sont basées sur la base de données [EPSG](https://epsg.org/).

Il est possible de rechercher une projection en tapant son code EPSG (par exemple "2154"), son nom (par exemple "Lambert-93") ou la zone à laquelle elle s'applique ("France") dans la barre de recherche.
Lorsque le code EPSG de la projection désirée est connu, il est conseillé de l'utiliser pour éviter toute ambiguïté.

<ZoomImg
    src="/projection-panel2.png"
    alt="Sélection d'une projection locale"
    caption="Sélection d'une projection locale"
/>

### Utilisation d'une projection à partir d'une chaîne de caractères Proj4 ou WKT1

Il est possible d'utiliser une projection à partir d'une chaîne de caractères Proj4 ou WKT1.

Pour cela, il suffit de copier-coller la chaîne de caractères Proj4 ou WKT1 dans le champ dédié et de donner un nom à la projection.

<ZoomImg
    src="/projection-panel3.png"
    alt="Création d'une projection à partir d'une chaîne de caractères Proj4 ou WKT1"
    caption="Création d'une projection à partir d'une chaîne de caractères Proj4 ou WKT1"
/>
