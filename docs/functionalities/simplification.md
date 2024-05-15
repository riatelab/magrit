# Simplification du tracé (généralisation)

En cartographie, la généralisation est une étape importante de la préparation des données
géographiques. Elle consiste à ... <!-- TODO -->

Dans Magrit, seule l'étape de simplification du tracé (entités linéaires ou surfaciques) est disponible.

Elle permet de réduire le nombre de points constituant le tracé d'une entité géographique. L'avantage est double :

- réduire la taille des données, et ce parfois de manière significative et sans différence notable à l'échelle où la carte est affichée, ce qui améliore les performances d'affichage et de calcul de l'application,
- améliorer la lisibilité de la carte en supprimant les détails inutiles.

Dans Magrit, cette opération de simplification du tracé est opérée sur la version topologique des entités géographiques
(cela a pour effet de préserver la topologie des entités géographiques, c'est-à-dire les relations d'adjacence entre les entités géographiques).

## Paramètres

Il est possible de xxxxxx <!-- TODO --> les coordonnées des points du tracé en définissant une valeur (généralement une puissance de 10)
qui correspond à la précision souhaitée. Les coordonnées sont arrondies à cette valeur ayant pour effet d'aider
à accrocher les points des entités voisines les uns aux autres lorsque la topologie du jeu de données d'entrées
n'est pas parfaite.

La simplification du tracé est réalisée à l'aide de l'algorithme de Visvalingam-Whyatt.
Cet algorithme est basé sur la suppression des points les moins importants d'une entité géographique en fonction de leur importance relative.

Le choix de la valeur adéquate pour la simplification du tracé dépend de la précision souhaitée pour la carte finale
et se fait par tâtonnement : le résultat doit vous satisfaire visuellement, sans générer de problèmes de topologies
(création d'auto-intersections, etc.) et sans occasionner la disparition d'entités géographiques. 

## Exemple

Dans l'exemple suivant, l'opération de simplification du tracé permet de passer d'un jeu de données
contenant au total XXXXX points à un jeu de données contenant XXXXX points :



