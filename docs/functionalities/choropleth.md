# Carte choroplèthe

Les **cartes choroplèthes** permettent de représenter des données de ratios par plages de couleurs.
Les données de rapports (de taux, d’intensités ou de ratios) sont des données quantitatives calculées à
partir de données de stocks dont ont fait le rapport ou dont on calcule le taux à partir d’un total.
Elles expriment les caractéristiques des individus observés mais leur total n'a pas de signification concrète.

Il peut s'agir par exemple de la densité de population, du taux de chômage, du taux de mortalité, etc.

## Paramètres lors de la création de la couche

Lors de la création d'une couche choroplèthe, il est nécessaire de renseigner les paramètres suivants :

- La variable à utiliser pour la représentation choroplèthe,
- La [discrétisation](./classification) à utiliser et les couleurs associées,
- Le souhait ou non d'afficher un graphique de résumé des classes de données,
- Le nom de la couche résultante.

La discrétisation peut être choisie via un raccourci vers les principales méthodes (Jenks, quantiles, etc.) :
dans ce cas la palette choisie par défaut est la palette `YlOrRd` de ColorBrewer et le nombre de classes
est calculé automatiquement.

Il est également possible d'ouvrir une fenêtre de paramétrage avancé permettant de choisir parmi d'autres
types de discrétisation et parmi un large éventail de palettes de couleurs.

## Exemples

<ZoomImg
    src="../choro.png"
    alt="Carte choroplèthe de la densité de population par quartier de la ville de Paris"
    caption="Carte choroplèthe de la densité de population par quartier de la ville de Paris"
/>

<ZoomImg
    src="../choro-histogram.png"
    alt="Carte choroplèthe de la densité de population par quartier de la ville de Paris (avec histogramme)"
    caption="Carte choroplèthe de la densité de population par quartier de la ville de Paris (avec histogramme)"
/>
