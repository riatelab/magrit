# Jointure

Lorsqu'un jeu de données géographies et un jeu de données tabulaires ont été ajoutés, il devient possible
d'associer ces deux jeux de données.

Cette association est possible grâce à la correspondance entre les valeurs d'identifiants se trouvant dans le jeu de données géographique
celles se trouvant dans la table de données.

Cette opération est appelée "jointure" (c'est également le cas dans les logiciels SIG ou les systèmes de gestion de bases
de données) et s'effectue ici simplement en choisissant le nom de la colonne contenant des valeurs d'identifiants
dans le jeu de données et dans le fond de carte.

Pour assurer le bon fonctionnement de cette méthode, les valeurs prisent par les identifiants , d'une part pour le fond de carte et d'autre part pour le jeu de données externe, doivent être uniques.

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

## Paramètres

Dans Magrit, la jointure s'effectue depuis le jeu de données tabulaires à joindre à un jeu de données géographiques.
Il est obligatoire de renseigner les paramètres suivants :

- La couche géographique à laquelle joindre les données,
- La colonne de la couche géographique contenant les valeurs d'identifiants,
- La colonne du jeu de données tabulaires contenant les valeurs d'identifiants.

Sur la base de ces informations, les correspondances entre les valeurs d'identifiants des deux jeux de données sont établies.

Si aucune correspondances n'est trouvée, il n'est pas possible de réaliser la jointure.
Si une ou plusieurs correspondances sont trouvées, les données tabulaires sont ajoutées aux entités correspondantes de la couche géographique,
sur les bases des options suivantes :

- Possibilité de sélectionner les colonnes à ajouter à la couche géographique,
- Possibilité d'ajouter un préfixe aux colonnes ajoutées,
- Possibilité de supprimer les entités de la couche géographique pour lesquelles aucune correspondance n'a été trouvée.
