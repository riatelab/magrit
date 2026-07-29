# Choroplèthe bivariée

Les cartes choroplèthes bivariées permettent de représenter simultanément deux variables quantitatives
relatives (taux, densités, proportions) sur une même carte, en associant à chaque unité spatiale une couleur
résultant de la combinaison des valeurs des deux variables.

Contrairement aux cartes choroplèthes classiques, qui se limitent à une seule variable, cette approche
offre une vision synthétique des interactions spatiales entre deux phénomènes, révélant des profils types ou
des décalages qui seraient difficilement visibles sur des cartes séparées.

Ce type de représentation est particulièrement utile pour explorer des relations complexes entre deux variables,
comme l’association entre le taux d’obésité et le taux de diabète, ou entre le niveau d’éducation et le taux de
chômage. Les cartes bivariées permettent de visualiser directement les corrélations, les oppositions ou les indépendances
entre les deux dimensions.


## Fonctionnement et options proposées

Chaque variable est discrétisée en trois classes (faible, moyen, élevé), selon la méthode de discrétisation
choisie (Ckmeans, quantiles, intervalles égaux, progression géométrique, choix manuel, etc.).
La carte finale utilise une palette de couleurs bivariée, générée à partir de deux progressions colorées univariées.
La couleur de chaque unité spatiale résulte alors du mélange des deux palettes, en fonction des classes auxquelles
appartiennent ses valeurs pour chaque variable.

Pour faciliter l’interprétation, deux éléments de légende sont proposés :

- Une légende matricielle 3×3 (neuf cases) qui présente toutes les combinaisons possibles de classes entre les deux variables, avec leur couleur associée.
- Un graphique de résumé sous forme de scatter plot avec une grille 3×3,
  indiquant le nombre d’unités spatiales dans chaque combinaison de classes.


## Limites et alternatives 

Les cartes choroplèthes bivariées  présentent certains écueils qu’il convient de prendre en compte.
D’abord, leur complexité visuelle peut rendre la lecture difficile pour un public non initié.
Les neuf combinaisons de couleurs, même bien choisies, demandent un effort d’interprétation plus important
qu’une carte univariée. Il est donc recommandé d’accompagner systématiquement la carte d’une légende détaillée
et, si possible, d’un texte explicatif pour guider l’utilisateur.

Ensuite, ce type de représentation suppose une relation pertinente entre les deux variables choisies.
Si celles-ci n’ont aucun lien logique ou statistique, la carte bivariée peut générer des fausses interprétations,
en suggérant des corrélations là où il n’y en a pas.

Si les données ou le public ne se prêtent pas à une carte bivariée, il peut être préférable de comparer
côte à côte deux cartes choroplèthes univariées (voir de préférer l'utilisation
de *small multiples* dans le cas ou plus de variables devraient être représentées).

Dans d'autres cas, si l’on suspecte une relation causale entre une variable explicative (variable
indépendante, ou prédicteur) et une variable expliquée (variable dépendante), il est possible d'utiliser
l'outil de cartographie des résidus d’une régression linéaire.

## Exemple

<ZoomImg
    src="/example-bichoro-diabetes-obesity.png"
    alt="Exemple de carte choroplèthe bivariée (diabète et obésité)"
    caption="Exemple de carte choroplèthe bivariée (diabète et obésité)"
/>

