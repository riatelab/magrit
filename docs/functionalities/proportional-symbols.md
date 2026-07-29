# Symboles proportionnels

Ces cartes permettent de représenter des **données de stocks** (ou quantitatives absolues)
par des figurés proportionnels.
Les données de stocks expriment des quantités concrètes : la somme des modalités des éléments a un sens.
Il peut s'agit par exemple de la population, de la quantité de déchets, du rendement d'une culture, etc.

## Choix des symboles

Les symboles pouvant être utilisés sont les suivants :
- **Cercle**
- **Carré**
- **Ligne** (seulement pour les données linéaires)

Le positionnement des symboles dépend de la géométrie des entités de la couche de données :

- pour les entités ponctuelles, les symboles sont positionnés sur les points,
- pour les entités linéaires, les symboles "cercle" et "carré" sont positionnés au centre de la ligne, et les symboles "ligne" sont positionnés le long de la ligne,
- pour les entités surfaciques, les symboles "cercle" et "carré" sont positionnés au centre de la surface.

## Chevauchement des symboles

Lors du choix des symboles "cercle" ou "carré", il est possible de choisir si les symboles sont autorisés à se chevaucher ou non.

Par défaut, les symboles sont autorisés à se chevaucher (puisqu'ils sont positionnés au centre des entités).

Si l'option "éviter le chevauchement" est activée, les symboles sont déplacés pour éviter les chevauchements.


## Coloration des symboles

Les symboles peuvent être colorés de différentes manières :
- couleur unique,
- selon une variable qualitative,
- selon une variable quantitative relative,
- selon que les valeurs sont positives ou négatives.

## Taille de référence

Lorsque vous définissez la valeur de référence et la taille de référence,
les symboles sont mis à l'échelle de sorte que la taille de référence corresponde toujours à la même surface de symbole,
quel que soit le type de symbole choisi :

- Pour les carrés, la taille de référence est la longueur du côté du carré dessiné pour la valeur de référence
  (donc une taille de référence de 100 px signifie un carré de 100 × 100 px, soit une surface de 10 000 px²).
- Pour les cercles, la taille de référence définit une surface équivalente : le cercle dessiné pour la valeur de référence
  a la même surface qu'un carré de la taille de référence
  (donc une taille de référence de 100 px signifie une surface de 10 000 px², ce qui correspond à un cercle d'un rayon
  d'environ 56,4 px — et non pas un rayon de 100 px).
- Pour les lignes, la taille de référence correspond simplement à la largeur de ligne utilisée pour la valeur de référence ;
  les autres largeurs de ligne sont mises à l'échelle proportionnellement aux valeurs (et non à une surface équivalente).

## Exemples


<ZoomImg
    src="/prop-symbols-0.png"
    alt="Carte en symboles proportionnels (couleur unique)"
    caption="Carte en symboles proportionnels (couleur unique)"
/>

<ZoomImg
    src="/prop-symbols-choro.png"
    alt="Carte en symboles proportionnels (coloration par variable quantitative relative)"
    caption="Carte en symboles proportionnels (coloration par variable quantitative relative)"
/>

<ZoomImg
    src="/prop-symbols-typo.png"
    alt="Carte en symboles proportionnels (coloration par variable qualitative)"
    caption="Carte en symboles proportionnels (coloration par variable qualitative)"
/>
