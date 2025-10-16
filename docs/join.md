# Jointure

Lorsqu'un jeu de données géographies et un jeu de données tabulaires ont été ajoutés, il devient possible
d'associer ces deux jeux de données.

Cette association est possible grâce à la correspondance entre les valeurs d'identifiants se trouvant dans le jeu de données géographique
celles se trouvant dans la table de données.

Cette opération est appelée "jointure" (c'est également le cas dans les logiciels SIG ou les systèmes de gestion de bases
de données) et s'effectue ici simplement en choisissant le nom de la colonne contenant des valeurs d'identifiants
dans le jeu de données et dans le fond de carte.

Pour assurer le bon fonctionnement de cette méthode, les valeurs prises par les identifiants, d'une part pour le fond de
carte et d'autre part pour le jeu de données externe, doivent être uniques.

## Exemple théorique

Exemple des valeurs attributaires d'un jeu de données géographique (avant jointure) :

| id | nom |
|----|-----|
| BE | Belgique |
| DE | Allemagne |
| FR | France |
| LU | Luxembourg |
| NL | Pays-Bas |

Exemple des valeurs attributaires du jeu de données tabulaire (avant jointure) :

| id_pays | pop_density |
|--------|-------------|
| DE     | 231.5       |
| LU     | 218.9       |
| NL     | 432.0       |
| FR     | 118.6       |
| BE     | 373.1       |

En effectuant une jointure du jeu de données tabulaire, sur le jeu de données géographiques,
en utilisant la colonne `id` du jeu de données géographique et la colonne `id_pays` du jeu de données tabulaire,
on obtient le jeu de données suivant :

| id | nom | pop_density |
|----|-----|-------------|
| BE | Belgique | 373.1 |
| DE | Allemagne | 231.5 |
| FR | France | 118.6 |
| LU | Luxembourg | 218.9 |
| NL | Pays-Bas | 432.0 |

Le jeu de données géographiques contient désormais les valeurs de densité de population du jeu de données tabulaire,
permettant d'en réaliser une représentation cartographique.

## Accéder à la fonctionnalité de jointure

Pour accéder à la fonctionnalité de jointure, il faut d'abord avoir ajouté un jeu de données géographique et un jeu
de données tabulaire.
Il est ensuite nécessaire de cliquer, dans le gestionnaire de couches, sur le bouton "Jointure" situé sur le jeu de
données tabulaire à joindre à un jeu de données géographique.

<ZoomImg
    src="/layer-manager-join-button.png"
    alt="Bouton de jointure dans le gestionnaire de couches"
    caption="Bouton de jointure dans le gestionnaire de couches"
/>

## Paramètres

Dans Magrit, la jointure s'effectue depuis le jeu de données tabulaires à joindre à un jeu de données géographiques.
Il est obligatoire de renseigner les paramètres suivants :

- La couche géographique à laquelle joindre les données,
- La colonne de la couche géographique contenant les valeurs d'identifiants,
- La colonne du jeu de données tabulaires contenant les valeurs d'identifiants.

Il est également possible de renseigner, de manière optionnelle, les paramètres suivants :

- Non-prise en compte de la casse des valeurs d'identifiants,
- Non-prise en compte des signes diacritiques, des espaces et des tirets dans les valeurs d'identifiants,

<ZoomImg
    src="/join-modal-before-selection.png"
    alt="Fenêtre de jointure avant séléction des champs d'identifiants"
    caption="Fenêtre de jointure avant séléction des champs d'identifiants"
/>

Sur la base de ces informations, les correspondances entre les valeurs d'identifiants des deux jeux de données sont établies.

## Affichage des colonnes utilisées pour la jointure et des résultats

Un tableau de données est affiché sous le menu déroulant du champ d'identifiant de la couche géographique et du jeu de données tabulaire.

Ce tableau affiche le numéro de ligne et la valeur d'identifiant des deux colonnes utilisées pour la jointure.

Les entrées avec des correspondances uniques sont affichées sans couleurs (il s'agit des correspondances valides pour la jointure).

Si des entrées ont des correspondances multiples, elles sont affichées en rouge (ce qui empêche la jointure de s'effectuer).
Si des entrées n'ont pas de correspondances ou sont vides, elles sont affichées en orange.
Les entrées affichées en rouge ou en orange sont remontées en haut du tableau pour faciliter leur identification.

### Résultats

Si aucune correspondances n'est trouvée (ou si des correspondances multiples sont trouvées,
c'est-à-dire si plusieurs valeurs d'identifiants du jeu de données géographique correspondent
à une même valeur d'identifiant du jeu de données tabulaire ou inversement),
il n'est pas possible de réaliser la jointure.

<ZoomImg
    src="/join-modal-no-match.png"
    alt="Fenêtre de jointure (aucune correspondance trouvée)"
    caption="Fenêtre de jointure (aucune correspondance trouvée)"
/>

Si une ou plusieurs correspondances sont trouvées, les données tabulaires peuvent être ajoutées aux entités correspondantes de la couche géographique,
sur les bases des options suivantes :

- Possibilité de sélectionner les colonnes à ajouter à la couche géographique,
- Possibilité d'ajouter un préfixe aux colonnes ajoutées,
- Possibilité de supprimer les entités de la couche géographique pour lesquelles aucune correspondance n'a été trouvée.

Une section de résumé affiche le nombre de correspondances trouvées dans la couches géographique et dans le jeu de données tabulaire (ainsi que le nombre d'entrées vides le cas échéant).

<ZoomImg
    src="/join-modal.png"
    alt="Fenêtre de jointure"
    caption="Fenêtre de jointure"
/>

<ZoomImg
    src="/join-modal-with-unmatched.png"
    alt="Fenêtre de jointure (avec des entités sans correspondance)"
    caption="Fenêtre de jointure (avec des entités sans correspondance)"
/>
