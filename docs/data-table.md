# Tableau de données

Le tableau de données est un élément central de l'interface de Magrit.
Il permet, pour chaque couche, de visualiser et de modifier ses données.

<ZoomImg
    src="./data-table.png"
    alt="Tableau de données"
    caption="Tableau de données"
/>

## Modification des données

La modification des données est possible en double-cliquant sur une cellule puis en rentant la valeur souhaitée.

<ZoomImg
    src="./data-table-edit.png"
    alt="Tableau de données - Modification"
    caption="Tableau de données - Modification"
/>

## Export au format CSV

Il est possible d'exporter le tableau de données affiché au format CSV en cliquant sur le bouton "Exporter en CSV..." en bas à gauche du tableau.
Lors de ce type d'export, la géométrie des entités n'est pas exportée (si vous souhaitez un type d'export qui inclut la géométrie,
vous pouvez utiliser la fonctionnalité "Export" dans le menu de gauche).


## Ajout d'un nouveau champ

Il est possible d'ajouter un nouveau champ en cliquant sur le bouton "Nouveau champ..." en bas à gauche du tableau.

Cette fonctionnalité est comparable à la fonctionnalité "calculatrice de champ" des logiciels SIG comme QGIS.

<ZoomImg
    src="./data-table-new-field.png"
    alt="Tableau de données - Nouveau champ"
    caption="Tableau de données - Nouveau champ"
/>

Les champs actuels de la couche sont accessibles sous forme de raccourcis (boutons jaunes) ainsi que trois champs spéciaux (boutons verts) :

- `$count` : le nombre d'entités dans la couche,
- `$id` : l'identifiant unique (et interne) de l'entité,
- `$area` : l'aire de l'entité (si il s'agit d'un polygone).

Plusieurs opérations sont possibles (certaines sont présentes sous forme d'un raccourci - boutons bleus) :

- les opérateurs mathématiques de base (`+`, `-`, `*`, `/`),
- des fonctions mathématiques (`sqrt`, `exp`, `abs`, `round`, `floor`, `ceil` et `power`),
- des fonctions de chaînes de caractères (`concat`, `substring`, `lower`, `upper`, `trim` et `replace`).
- les opérateurs de comparaison (`LIKE`, `=`, `!=`, `>`, `>=`, `<` et `<=`), la négation (`NOT`) et les opérations logiques (`AND`, `OR`),
- la construction de conditions (`CASE WHEN ... THEN ... ELSE ... END`).

Afin de créer un nouveau champ, il est nécessaire de spécifier le nom du champ à créer, le type de données (stock, ratio, etc.) et la formule de calcul.
Lorsque la formule est valide, un aperçu des valeurs calculées (8 premières lignes du tableau) est affiché.

<ZoomImg
    src="./data-table-new-field-zoom.png"
    alt="Tableau de données - Nouveau champ avec formule valide"
    caption="Tableau de données - Nouveau champ avec formule valide"
/>


Lorsque la formule n'est pas valide, un message d'erreur est affiché et le bouton "Calculer" est désactivé.

<ZoomImg
    src="./data-table-invalid-formula1.png"
    alt="Tableau de données - Nouveau champ avec formule invalide"
    caption="Tableau de données - Nouveau champ avec formule invalide"
/>

<ZoomImg
    src="./data-table-invalid-formula2.png"
    alt="Tableau de données - Nouveau champ avec formule invalide"
    caption="Tableau de données - Nouveau champ avec formule invalide"
/>

### Exemples de formules

#### Reclasser des données quantitatives en données qualitatives

La construction de formules utilisant des conditions permet de facilement reclasser des données quantitatives en données qualitatives.
Par exemple, pour créer une nouvelle colonne "Type de population" basée sur la colonne "Population" avec les
conditions suivantes :

- si la population est inférieure à 1000, alors "Petite",
- si la population est comprise entre 1000 et 10000, alors "Moyenne",
- si la population est supérieure à 10000, alors "Grande".

```sql
CASE WHEN Population < 1000 THEN 'Petite'
     WHEN Population >= 1000 AND Population <= 10000 THEN 'Moyenne'
     ELSE 'Grande'
END
```

#### Extraire le code départemental à partir du code INSEE

Pour extraire le code départemental à partir du code INSEE, il est possible d'utiliser la fonction `substring` pour extraire les deux premiers caractères du code INSEE.

```sql
substring(Code_INSEE, 1, 2)
```

#### Calculer la densité de population d'un territoire

Pour calculer la densité de population, il est possible de diviser la population par l'aire du territoire concerné.
Attention à l'unité du champ contenant l'aire et à multiplier le résultat obtenu si nécessaire.
Admettons ici que l'aire soit en m² et que l'on souhaite obtenir une densité en hab/km² :

```sql
Population / Aire * 1000000
```

## Suppression d'un champ

Il est possible de supprimer un champ en effectuant un clic droit sur le nom du champ (dans l'entête de colonne) puis en cliquant sur "Supprimer la colonne".

## Fermeture du tableau de données

Lors de la fermeture du tableau de données et si des modifications ont été effectuées, un popup de confirmation s'ouvre.
Il est possible de sauvegarder les modifications effectuées en cliquant sur le bouton "Confirmation" ou d'annuler les modifications en cliquant sur le bouton "Annulation".
