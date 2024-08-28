# Carte lissée

Il s'agit d'une méthode permettant d'analyser et de représenter la répartition spatiale d'un phénomène,
quelque soit l’hétérogénéité du maillage, en tout point de la carte, via la représentation de la valeur de la densité du phénomène
et la prise en compte de son voisinage.

En fonction des paramètres utilisés, ces méthodes permettent
*"de voir aussi bien les spécificités locales d'un phénomène que ses tendances générales"* (Lambert & Zanin, 2016)

Les deux méthodes de lissage proposées sont :
- Potentiel de Stewart,
- Estimation de densité par noyaux (*Kernel Density Estimation* ou KDE).


## Paramètres

Lors de la création d'une couche de ce type, il est nécessaire de renseigner les paramètres suivants :

- La variable à utiliser,
- La variable de poids / le diviseur (optionnelle),
- Le type de lissage (Stewart ou KDE),
- La résolution de la grille de calcul en kilomètres,
- Le type de noyau parmi :
  - Gaussien ou pareto (pour les potentiels de Stewart),
  - Gaussien, uniforme ou triangulaire (pour les KDE),
- La portée du lissage en kilomètres et le beta (pour les potentiels de Stewart),
- La portée du noyau en kilomètres (pour les KDE).

Ces paramètres permettent de calculer les valeurs de densité du phénomène à chaque point de la grille de calcul, en prenant en compte les valeurs des points voisins.
Une fois celles-ci calculées, il est nécessaire de choisir des valeurs de seuil pour définir les classes de densité à représenter, sous forme
d'une carte choroplèthe.

Il faut donc choisir ici :
- Les limites de classes,
- Le nom de la couche résultante.

## Exemple

<ZoomImg
    src="/smoothed-stewart-pop.png"
    alt="Potentiel de population dans un voisinage gaussien de 20 km (méthode de Stewart - données de population des communes françaises)"
    caption="Potentiel de population dans un voisinage gaussien de 20 km (méthode de Stewart - données de population des communes françaises)"
/>