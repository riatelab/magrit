# Carte lissée

Il s'agit d'une méthode permettant d'analyser et de représenter la répartition spatiale d'un phénomène,
quelque soit l’hétérogénéité du maillage, en tout point de la carte, via la représentation de la valeur de la densité du phénomène
et la prise en compte de son voisinage.

En fonction des paramètres utilisés, ces méthodes permettent
*"de voir aussi bien les spécificités locales d'un phénomène que ses tendances générales"* (Lambert & Zanin, 2016)

Les deux méthodes de lissage proposées sont :
- Potentiel de Stewart,
- Estimation de densité par noyaux (*Kernel Density Estimation* ou KDE).

## Exemple

Potentiel de population dans un voisinage gaussien de 20 km

<ZoomImg
    src="/smoothed-stewart-pop.png"
    alt="Potentiel de population dans un voisinage gaussien de 20 km (méthode de Stewart - données de population des communes françaises)"
    caption="Potentiel de population dans un voisinage gaussien de 20 km (méthode de Stewart - données de population des communes françaises)"
/>