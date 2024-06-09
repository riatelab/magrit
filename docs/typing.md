# Typage des données 

À chaque type de données est associé un certain nombre de modes de fonctionnalités possibles. Une fois les données importées,
il est donc important de définir le type de chacune des variables du jeu de données que vous souhaitez cartographier.

<ZoomImg
    src="./img/field-typing.png"
    alt="Typage des champs"
    caption="Fenêtre de typage des champs"
/>

5 types de données sont possibles dans Magrit :

- Identifiant (champs notamment utilisés pour joindre les données)
- Stock (variable quantitative absolue)
- Ratio (variable quantitative relative)
- Catégorie (variable qualitative)
- Inconnu (par exemple pour les champs que vous ne souhaitez pas utiliser)

## Stock

Les variables quantitatives relatives (ou variables de stock) expriment des quantités concrètes et leur somme ont un sens
(nombre de chômeurs, population totale, par exemple).

La représentation de ce type de phénomènes doit respecter l’expression de ces quantités et les différences de proportionnalité entre les différents éléments qui en découlent.

Exemples : Population totale en milliers d'habitants, Superficie en hectares.

## Ratios

Les variables quantitatives relative (aussi appelées variable de taux, ou variable de ratios),
expriment un rapport entre deux quantités dont la somme n’a pas de signification.
Par extension, on peut y associer les indicateurs composites numériques associant plusieurs indicateurs (indices…).

Exemples : PIB par habitant, Indicateur de développement humain.

## Catégories

Les modalités des caractères qualitatifs ne sont pas mesurables, ce sont des noms, des sigles ou des codes.
On ne peut sommer des modalités qualitatives, on ne peut en calculer la moyenne.

Exemples : Noms des départements, Type d'occupation du sol.

## Identifiant

Ce champ contient des valeurs permettant d'identifier de manière unique chacune des entités de la couche de données.
Ce sont ces champs qui sont utilisés pour effectuer une jointure de données.

Exemple : Code INSEE de la commune, Code ISO2 d'un pays.

## Inconnu

Ce type de champ est utilisé pour les champs que vous ne souhaitez pas utiliser dans l'application : ils
ne seront pas proposés dans les menus de sélection des variables.