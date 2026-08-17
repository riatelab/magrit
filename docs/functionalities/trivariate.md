# Choroplèthe trivariée

Les cartes choroplèthes trivariées permettent de représenter trois variables formant une composition ternaire,
c’est-à-dire dont les valeurs, exprimées en proportions, s’additionnent à 100 % (ou à 1) pour chaque unité spatiale.

Ce type de représentation s’appuie sur une propriété géométrique fondamentale : toute composition ternaire
peut être représentée dans un triangle équilatéral, où chaque sommet correspond à une variable pure (100 %),
et où la position de chaque point à l’intérieur du triangle reflète les proportions relatives des trois composantes.

Le triangle, ou diagramme ternaire, est en effet la représentation naturelle des données de composition,
car il permet de visualiser simultanément les trois dimensions tout en respectant la contrainte de totalité
(p1 + p2 + p3 = 100 %).
Dans ce triangle, chaque point y est défini par ses coordonnées barycentriques : sa position est déterminée
par les proportions des trois variables, et c’est cette position qui détermine la couleur attribuée à l’unité spatiale
correspondante sur la carte.

Ce type de représentation est particulièrement adapté pour visualiser des structures de répartition, comme la répartition
en secteur d'activités économiques (primaire, secondaire tertiaire), la composition des usages du sol
(agricole, urbain, forestier), ou encore les parts de marché de trois acteurs dominants (ou de trois partis politiques).

Cette propriété permet de mettre en évidence des profils de composition et des déséquilibres entre les trois dimensions,
offrant parfois une vision synthétique des dynamiques spatiales à l’œuvre.

## Aide à la lecture de la légende

Pour aider à la lecture du diagramme ternaire, il est possible d'utiliser le schéma suivant. Pour lire les valeurs de chaque variable pour l'unique point représenté, il suffit de suivre les barres rouges qui partent du point en direction de chaque arête (c'est-à-dire en direction de chaque axe de graduation). La valeur pour chaque variable est ensuite lue sur l'axe correspondant.


<ZoomImg
    src="/trico-explanation.png"
    alt="Aide à la lecture de la légende d'une carte choroplèthe trivariée"
    caption="Aide à la lecture de la légende d'une carte choroplèthe trivariée"
/>

Nous pouvons ainsi voir ici que les valeurs sont d'environ 40 % pour la variable 1 (ISCED 0-2), 45 % pour la variable 2 (ISCED 3-4) et 15 % pour la variable 3 (ISCED 5-8).

L'utilisation de la rotation des valeurs affichées sur les axes (disponible en option) permet de faciliter la lecture des valeurs pour chaque variable, en les affichant dans le sens de lecture de la variable correspondante.

## Paramètres pour contrôler les couleurs

Dans les modes de coloration "discret" et "continu", les couleurs sont contrôlées par un ensemble de paramètres permettant de régler la teinte, la saturation et la luminosité des couleurs attribuées à chacune des trois composantes.
Il n'est donc pas possible de choisir directement les couleurs des trois composantes, mais plutôt de définir un schéma de coloration qui sera appliqué au triangle.
Cela garantit la cohérence de la représentation des données (même intensité chromatique et même luminosité) et évite les choix de couleurs arbitraires qui pourraient induire en erreur lors de l'interprétation des résultats.

Ainsi, les valeurs des paramètres utilisés pour contrôler les couleurs sont les suivantes :

- *Hue* (teinte) : définit la teinte du premier composant (p1 – coin gauche). Les teintes des deux autres composants sont automatiquement fixées à +120° (pour p2 – coin supérieur) et +240° (pour p3 – coin droit) sur le cercle chromatique, formant ainsi un schéma triadique.
- *Chroma* (saturation / intensité chromatique) : contrôle la saturation/intensité maximale des couleurs aux sommets du triangle. Plus cette valeur est élevée, plus les couleurs sont vives et distinctes.
- *Lightness* (Luminosité) : détermine la luminosité globale de la palette. Elle affecte toutes les couleurs du triangle.
- *Contrast* (Contraste) : contrôle la différence de luminosité et de saturation entre le centre (mélange équilibré) et les coins (composantes pures). Un contraste plus élevé rend les coins plus distincts du centre.
- *Spread* (Étendue) : contrôle l'étendue du dégradé de couleurs autour du centre. Une valeur plus élevée concentre la différenciation des couleurs près du centre.

## Exemple

<ZoomImg
    src="/example-trichoro-discrete-edu-black-banner.png"
    alt="Exemple de carte choroplèthe trivariée (Niveau d'éducation le plus élevé - coloration en 9 classes)"
    caption="Exemple de carte choroplèthe trivariée (Niveau d'éducation le plus élevé - coloration en 9 classes)"
/>

<ZoomImg
    src="/example-trichoro-sextant-black-bg.png"
    alt="Exemple de carte choroplèthe trivariée (secteurs d'activités économiques - coloration par sextant - centrage sur la moyenne)"
    caption="Exemple de carte choroplèthe trivariée (secteurs d'activités économiques - coloration par sextant - centrage sur la moyenne)"
/>

## Limites et alternatives

Les cartes choroplèthes trivariées, bien que puissantes pour visualiser des compositions, présentent des limites
qu’il est important de prendre en compte.

D’abord, leur complexité visuelle peut rendre la lecture difficile, surtout pour un public non familier avec
les diagrammes ternaires. Les couleurs résultantes, bien que logiquement construites à partir des coordonnées
barycentriques, ne sont pas toujours intuitives.
Il est donc essentiel d’accompagner systématiquement la carte d’une légende détaillée et, si possible, d’un
texte explicatif pour guider l’interprétation.

Enfin, ce type de représentation suppose que les trois variables forment une composition cohérente (somme = 100 %).
Si cette condition n’est pas respectée, ou si les variables n’ont pas de lien logique entre elles, la carte peut
générer des fausses interprétations. Dans ce cas, il peut être préférable de recourir à d’autres méthodes (comparaison
de cartes choroplèthes côte à côte, *small multiples*, etc.).
