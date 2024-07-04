# Liens / Flux

Ce type de carte représente, avec des lignes d'épaisseur proportionnelle à l'intensité du phénomène, les connexions
(flux / liens) qui existent entre des couples de lieux.
Différents éléments, tels que la présence de chevauchements trop nombreux, peuvent nuire à la lisibilité de ce type de
représentation.
Ce type de carte requiert généralement d'effectuer une sélection après le premier rendu, consistant par exemple à ne pas
représenter les liens avec les intensités les plus faibles ou à ne représenter que les liens au départ ou à l'arrivée
d'un lieu donné.

Magrit propose de représenter l'épaisseur de la ligne de plusieurs façons :

- en discrétisant les valeurs à utiliser (choix d'un type de discrétisation et d'un nombre de classes, permettant parfois une meilleure hiérarchisation des informations), ou,
- sans discrétiser les valeurs (l'épaisseur des lignes est ainsi strictement proportionnelle à la valeur de son intensité).

Par ailleurs, Magrit propose plusieurs types de liens :

- Liaison / lien simple : une ligne relie deux points, avec une notion de direction.
- Échange : une ligne relie deux points, avec une notion de direction et avec une épaisseur proportionnelle à l'intensité de l'échange.
- Volume bilatéral : une ligne relie deux points, sans notion de direction et avec une épaisseur proportionnelle à l'intensité de l'échange (cumul des échanges dans les deux sens).

Le type de lien "liaison / lien simple" est le plus simple à mettre en œuvre, car il ne nécessite pas de colonne
représentant l'intensité de la liaison.

Les deux autres types de liens nécessitent une colonne supplémentaire contenant l'intensité de la liaison.
Dans le cas du type "Échange", une ligne est créée pour chaque couple de points, tandis que dans le cas du type "Volume
bilatéral", une seule ligne est créée pour chaque couple de points, avec une épaisseur proportionnelle à la somme des
échanges dans les deux sens.

## Configuration de l'affichage des liens après création de la couche

Après la création de la couche de liens, il est possible de filtrer les liens à afficher en fonction de plusieurs critères :

- la valeur d'intensité des liens le cas échéant,
- la longueur (en km) des liens,
- l'origine et la destination des liens.

<ZoomImg
    src="/link-selection.png"
    alt="Interface de configuration des liens après création de la couche"
    title="Interface de configuration des liens après création de la couche"
/>

## Exemple

<ZoomImg
    src="/link-map.png"
    alt="Exemple de carte, après sélection de l'origine "France" et distance inférieure à 1015 km'
    title="Exemple de carte, après sélection de l'origine "France" et distance inférieure à 1015 km"
/>