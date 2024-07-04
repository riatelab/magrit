# Join

When you have a geographical dataset and a tabular dataset that share a common field,
you can join them to add the columns of the tabular dataset to the geographical dataset.

## Theorical example

Example of attributes in a geographical dataset:

| id | name       |
|----|------------|
| BE | Belgium    |
| DE | Deutschland|
| FR | France     |
| LU | Luxembourg |
| NL | Nederland  |

Example of attributes in a tabular dataset:

| id_country | pop_density |
|------------|-------------|
| DE         | 231.5       |
| LU         | 218.9       |
| NL         | 432.0       |
| FR         | 118.6       |
| BE         | 373.1       |

By joining the tabular dataset to the geographical dataset using the `id` column of the geographical dataset and the `id_country` column of the tabular dataset,
we obtain the following dataset:

| id | name       | pop_density |
|----|------------|-------------|
| BE | Belgium    | 373.1       |
| DE | Deutschland| 231.5       |
| FR | France     | 118.6       |
| LU | Luxembourg | 218.9       |
| NL | Nederland  | 432.0       |

The geographical dataset now contains the population density values from the tabular dataset,
allowing for a cartographic representation of this value.

## Parameters

In Magrit, the join is done from the tabular dataset to be joined to a geographical dataset.
It is mandatory to fill in the following parameters:

- The geographical layer to which to join the data,
- The column of the geographical layer containing the identifier values,
- The column of the tabular dataset containing the identifier values.

Based on this information, the correspondences between the identifier values of the two datasets are established.

If no correspondences are found, it is not possible to perform the join.
If one or more correspondences are found, the tabular data is added to the corresponding entities of the geographical layer,
based on the following options:

- Possibility to select the columns to add to the geographical layer,
- Possibility to add a prefix to the added columns,
- Possibility to remove the entities from the geographical layer for which no correspondence has been found.
