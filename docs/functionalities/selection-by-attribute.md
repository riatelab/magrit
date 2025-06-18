# Sélection attributaire

La sélection par attribut(s) permet de filtrer les entités d'une couche en fonction de valeurs d'attributs.

Le champ de formule est le même que pour la création d'un nouveau champ dans le [tableau de données](../data-table)
à la différence que la formule construite doit ici renvoyer un booléen : Vrai (*True*) ou Faux (*False*).
Les entités pour lesquelles la formule renvoie Vrai sont sélectionnées et utilisées pour créer la nouvelle
couche de données.

Il est ainsi possible de créer des sélections simples ou des sélections complexes en combinant plusieurs conditions.

Les champs actuels de la couche sont accessibles sous forme de raccourcis (boutons jaunes) ainsi que trois champs spéciaux (boutons verts) :

- `$count` : le nombre d'entités dans la couche,
- `$id` : l'identifiant unique (et interne) de l'entité,
- `$area` : l'aire de l'entité (s'il s'agit d'un polygone).

Plusieurs opérations sont possibles (certaines sont présentes sous forme d'un raccourci - boutons bleus) :

- les opérateurs mathématiques de base (`+`, `-`, `*`, `/`),
- des fonctions mathématiques (`sqrt`, `exp`, `abs`, `round`, `floor`, `ceil` et `power`),
- des fonctions de chaînes de caractères (`concat`, `substring`, `lower`, `upper`, `trim` et `replace`).
- les opérateurs de comparaison (`LIKE`, `=`, `!=`, `>`, `>=`, `<` et `<=`), la négation (`NOT`) et les opérations logiques (`AND`, `OR`),
- la construction de conditions (`CASE WHEN ... THEN ... ELSE ... END`).

Attention toutefois à la syntaxe permettant de sélectionner les entités sans données : en SQL, il est courant
d'utiliser `variable IS NULL` pour vérifier si une valeur est absente. Dans Magrit, il faut utiliser
`NOT variable` pour vérifier si une valeur est absente (c'est-à-dire que la variable n'est pas définie ou
son contenu est vide).

## Exemples de sélections simples

### Sélection des entités dont la population est supérieure à 10000

```sql
Population > 10000
```


### Sélection des communes appartenant aux départements 75, 92, 93 et 94

```sql
Departement IN ('75', '92', '93', '94')
```

Alternative utilisant des opérateurs logiques :

```sql
Departement = '75' OR Departement = '92' OR Departement = '93' OR Departement = '94'
```

#### Sélection des entités dont le nom commence par "Saint"

```sql
Nom LIKE 'Saint%'
```

#### Sélection de l'entité avec le nom "Paris"

```sql
Nom = 'Paris'
```

## Exemples de sélections complexes (1)

Ces exemples combinent plusieurs conditions grâce aux opérateurs logiques `AND` et `OR`.

### Sélection des entités dont la population est comprise entre 1000 et 10000

```sql
Population >= 1000 AND Population <= 10000
```

### Sélection des communes appartenant aux départements 75, 92, 93 et 94 et dont la population est supérieure à 10000

```sql
Departement IN ('75', '92', '93', '94') AND Population > 10000
```

### Sélection des communes du département 94 dont le nom commence par "Saint" et dont la population est supérieure à 10000

```sql
Departement = '94' AND Nom LIKE 'Saint%' AND Population > 10000
```

## Exemples de sélections complexes (2)

Il est possible de combiner plusieurs conditions en utilisant des parenthèses pour définir la priorité des opérations.
Il est également possible d'utiliser la construction `CASE WHEN ... THEN ... ELSE ... END` pour cela.

### Sélection des communes du département 94 dont le nom commence par "Saint" ou "Ville" et dont la population est supérieure à 10000

```sql

Departement = '94' AND (Nom LIKE 'Saint%' OR Nom LIKE 'Ville%') AND Population > 10000
```

### Sélection des communes du département 94 dont le nom commence par "Saint" ou "Ville" et des communes de n'importe quel département dont la population est comprise entre 1000 et 10000

```sql
CASE WHEN Departement = '94' THEN
  Nom LIKE 'Saint%' OR Nom LIKE 'Ville%'
ELSE
  Population >= 1000 AND Population <= 10000
END
```

### Sélection des pays qui n'ont pas de valeur pour le champ "REGION_BLOC"

```sql
NOT REGION_BLOC
```