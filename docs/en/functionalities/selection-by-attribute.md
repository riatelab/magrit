# Selection by attribute

Selection by attribute(s) allows you to filter entities in a layer according to attribute values.

The formula field is the same as for creating a new field in the [data table](../data-table), with the difference that the formula constructed here must return a Boolean: True (*True*) or False (*False*).

Entities for which the formula returns True are selected and used to create the new data layer.

It is thus possible to create simple selections or complex selections by combining several conditions.


The layer's current fields can be accessed as shortcuts (yellow buttons), as well as three special fields (green buttons):

- `$count`: the number of entities in the layer,
- `$id`: the unique (and internal) identifier of the entity,
- `$area`: the area of the entity (if it's a polygon).

Several operations are possible (some in the form of a shortcut - blue buttons):

- basic mathematical operators (`+`, `-`, `*`, `/`),
- mathematical functions (`sqrt`, `exp`, `abs`, `round`, `floor`, `ceil` and `power`),
- string functions (`concat`, `substring`, `lower`, `upper`, `trim` and `replace`).
- comparison operators (`LIKE`, `=`, `!=`, `>`, `>=`, `<` and `<=`), negation (`NOT`) and logical operations (`AND`, `OR`),- construction of conditions (`CASE WHEN ... THEN ... ELSE ... END`).

## Examples of simple selections

### Selection of entities with a population greater than 10000

```sql
Population > 10000
```

### Selection of communes belonging to departments 75, 92, 93 and 94

```sql
Department IN ('75', '92', '93', '94')
```

Alternative using logical operators :

```sql
Department = '75' OR Department = '92' OR Department = '93' OR Department = '94'
```

#### Selection of entities whose name begins with "Saint".

```sql
Name LIKE 'Saint%'
```

#### Selection of the entity with the name "Paris".

```sql
Name = 'Paris
```

## Examples of complex selections (1)

These examples combine several conditions using the logical operators `AND` and `OR`.

### Selection of entities with a population between 1000 and 10000

```sql
Population >= 1000 AND Population <= 10000
```

### Selection of communes in départements 75, 92, 93 and 94 with a population greater than 10000

```sql
Department IN ('75', '92', '93', '94') AND Population > 10000
```

### Selection of communes in department 94 whose name begins with "Saint" and whose population is greater than 10000

```sql
Department = '94' AND Name LIKE 'Saint%' AND Population > 10000
```

## Examples of complex selections (2)

You can combine several conditions by using parentheses to define the priority of operations.
You can also use the `CASE WHEN ... THEN ... ELSE ... END` construction.

### Selection of communes in department 94 whose name begins with "Saint" or "Ville" and whose population is greater than 10000

```sql

Department = '94' AND (Name LIKE 'Saint%' OR Name LIKE 'Ville%') AND Population > 10000
```

### Selection of communes in department 94 whose name begins with "Saint" or "Ville" and communes in any other department whose population is between 1000 and 10000

```sql
CASE WHEN Departement = '94' THEN
  Name LIKE 'Saint%' OR Name LIKE 'Ville%' ELSE
ELSE
  Population >= 1000 AND Population <= 10000
END
```

