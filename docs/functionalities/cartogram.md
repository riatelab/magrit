# Cartogramme (anamorphose)

Les cartogrammes, ou anamorphoses, sont utilisées en cartographie statistique pour montrer l'importance d'un phénomène donné :
ce type de carte est couramment appelé un cartogramme.
Elles permettent de déformer les unités territoriales (polygones) sur la base d'un attribut rapporté à la superficie
des entités (densité).

Trois méthodes de création de cartogrammes sont disponibles dans Magrit :

- la première, basée sur l'algorithme de Dougenik et al. (1) permet la création de cartogrammes "contigus" (la topologie du fond de carte est préservée tant que possible),
- la seconde, basée sur l'algorithme de Olson (2) permet la création de cartogrammes "non-contigus" (la méthode ne cherche pas à préserver la topologie du fond de carte),
- la troisième, basée sur l'algorithme de Gastner, Seguy et More (3) permet la création de cartogrammes "contigus" (la topologie du fond de carte est préservée tant que possible).

Les méthodes (1) et (3) offrent des résultats comparables en termes de qualité visuelle, mais la méthode (1) est généralement plus rapide.

## Exemple

<ZoomImg
    src="/cartograms.png"
    alt="Les 3 types de cartogrammes appliqués aux quartiers de Paris (variable: Population 2012)"
    caption="Les 3 types de cartogrammes appliqués aux quartiers de Paris (variable: Population 2012)"
/>

## Références

(1) Dougenik, James A.; Chrisman, Nicholas R.; Niemeyer, Duane R. (1985), "An Algorithm to Construct Continuous Area Cartograms", *The Professional Geographer*, 37(1). [doi: 10.1111/j.0033-0124.1985.00075.x](https://doi.org/10.1111/j.0033-0124.1985.00075.x)

(2) Olson, Judy M. (1976). "Noncontiguous Area Cartograms". *The Professional Geographer*, 28(4). [doi: 10.1111/j.0033-0124.1976.00371.x](https://doi.org/10.1111/j.0033-0124.1976.00371.x)

(3) Gastner, Michael T.; Seguy, Vivien; More, Pratyush (2018). "Fast flow-based algorithm for creating density-equalizing map projections". *Proceedings of the National Academy of Sciences USA*, 115:E2156-E2164. [doi: 10.1073/pnas.1712674115](https://doi.org/10.1073/pnas.1712674115)

