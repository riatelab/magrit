# Régression linéaire simple

Magrit propose de réaliser une régression linéaire simple entre les valeurs contenues dans deux colonnes d'un jeu de données géographique.

La régression linéaire simple est une méthode statistique qui permet de modéliser une relation linéaire entre deux variables
(une variable dépendante et une variable indépendante) par une droite.
Cette droite est définie par une équation de la forme `y = a * x + b`, où `y` est la variable dépendante, `x` est la variable indépendante, `a` est le coefficient directeur de la droite et `b` est l'ordonnée à l'origine.

Cela permet d'expliquer à quel point un phénomène est influencé par un autre.

Une fois la relation entre les deux variables établie, il est possible de visualiser cette relation sous forme de carte, de deux manières différentes :

- soit en cartographiant les résidus de la régression, c'est-à-dire les écarts entre les valeurs observées et les valeurs prédites par le modèle,
  via une carte de symboles proportionnels,
- soit en cartographiant les résidus standardisés, c'est-à-dire les écarts entre les valeurs observées et les valeurs prédites par le modèle, divisés par l'écart-type des résidus,
  via une carte choroplèthe.

## Exemple

<ZoomImg
  src="/linear-reg.png"
  alt="Exemple de régression linéaire avec représentation des résidus (carte en symboles proportionnels)"
  caption="Exemple de régression linéaire avec représentation des résidus (carte en symboles proportionnels)"
/>