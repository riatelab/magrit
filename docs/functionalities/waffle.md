# Carte en gaufre

Cette méthode permet de représenter plusieurs stocks dans des unités comparables pour chacune des entités sous forme
d'un grille de symboles.
Pour chaque entité, un ensemble de symboles (d'une taille fixe) est utilisé pour représenter les différentes valeurs
selon un ratio prédéfini (par exemple, 1 symbole pour 1000 unités). Chaque variable de stock est représentée par une
couleur différente.

## Paramètres lors de la création de la couche

Lors de la création de la couche, il est nécessaire de choisir les paramètres suivants :

- Les variables de stock à utiliser (au minimum 2),
- Le type de symbole (carré ou cercle),
- La taille de chaque symbole (rayon du cercle ou taille d'un coté du carré, en pixel),
- Le ratio de conversion (nombre d'unités par symbole),
- Le comportement de la grille (nombre fixe de colonnes ou nombre de colonnes dynamique),
- L'espacement entre chaque ligne / colonne de symboles.

Après création de la couche, il est possible de modifier :

- la couleur de chaque variable de stock,
- leur ordre d'affichage,
- le nom de chaque variable (tel qu'il apparait dans la légende),
- l'ancrage (vertical et horizontal) des groupes de symboles,
- la position de chaque groupe de symboles (en les déplaçant à la souris).

## Exemple

<ZoomImg
    src="/waffle-dynamic.png"
    alt="Exemple de carte en gaufre avec 2 variables de stock et nombre de colonnes dynamique"
    caption="Exemple de carte en gaufre avec 2 variables de stock et nombre de colonnes dynamique"
/>

<ZoomImg
    src="/waffle-fixed.png"
    alt="Exemple de carte en gaufre avec 2 variables de stock et nombre de colonnes fixe"
    caption="Exemple de carte en gaufre avec 2 variables de stock et nombre de colonnes fixe"
/>
