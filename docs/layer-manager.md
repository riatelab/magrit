# Le gestionnaire de couche

Le gestionnaire de couche permet de modifier les paramètres de chacun des jeux de données (qu'il s'agisse d'une couche 
de données géographiques ou d'un tableau de données) ajoutés dans l'application.

<div style="text-align: center;">
    <img src="./img/layer-manager.png" alt="Gestionnaire de couche" style="margin: auto;">
    <i>Exemple : Gestionnaire de couche avec trois couches géographiques et un tableau de données</i>
</div>

Lorsque des couches géographiques et des tableaux de données sont présents, ils sont séparés par un séparateur horizontal
dans le gestionnaire de couche.

## Couches géographiques (partie supérieure)

Plusieurs fonctionnalités sont accessibles pour chacune des couches de données géographiques :

- affichage d'un résumé d'information sur la couche,
- modification des [paramètres de la couche](./layer-properties) (couleur, bordure, opacité, etc.),
- inverser la visibilité de la couche (visible / invisible),
- zoomer sur la couche,
- afficher le [tableau de données](./data-table) associé à la couche,
- modifier le [typage des champs](./typing) de la couche,
- supprimer la couche.

Par ailleurs, comme dans un logiciel SIG ou dans un logiciel de dessin vectoriel, l'ordre des couches dans le gestionnaire de couche
reflète l'ordre d'affichage des couches sur la carte (la couche en haut de la liste est affichée au-dessus des autres couches, etc.).
Il est possible de modifier l'ordre des couches en les faisant glisser-déposer à la position souhaitée.

## Tableaux de données (partie inférieure)

Pour chaque tableau de données, il est possible de :

- afficher un résumé d'information sur le tableau,
- [joindre les données à une couche géographique](./join),
- afficher le [tableau de données](./data-table),
- modifier le [typage des champs](./typing) de la couche,
- supprimer le tableau de données.

Dans Magrit les données tabulaires ont deux principales utilités :

- être jointes à une couche géographique pour permettre la création de cartes thématiques,
- être utilisées pour la création de cartes de liens (ou cartes de flux).