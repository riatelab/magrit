# Carroyage

La méthode du carroyage est une méthode permettant d'essayer de s'affranchir de l'arbitraire et de 
l'irrégularité d'un découpage administratif en découpant le territoire en unités régulières.
Les carreaux ainsi créés sont affectés de la valeur de la variable observée pour les entités intersectées, au prorata des surfaces concernées.
Cette méthode met ainsi en évidence les grandes tendances de la répartition spatiale d'un phénomène.

## Paramètres

Lors de la création d'une couche de ce type, il est nécessaire de renseigner les paramètres suivants :

- La variable à utiliser,
- Le type de maillage à utiliser (hexagones, carrés, triangles, losanges),
- La taille des carreaux,
- Le nom de la couche résultante.

Après la création de la couche, il est possible de modifier la discrétisation des données (nombre de classes, types de discrétisation, palettes de couleurs, etc.). 

## Exemples

<ZoomImg
    src="/grid-0.png"
    alt="Carroyage (hexagones - variable 'POPULATION' - jeu de données des communes françaises)"
    caption="Carroyage (hexagones - variable 'POPULATION' - jeu de données des communes françaises)"
/>