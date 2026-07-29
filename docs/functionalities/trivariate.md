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

## Risques et alternatives

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

## Aide à la lecture de la légende

Pour aider à la lecture du diagramme ternaire, il est possible d'utiliser le schéma suivant : 


Sur ce schéma, chaque sommet du triangle correspond à une variable pure (100 %).
Le sens de lecture pour chaque variable est ensuite indiqué par les barres de graduation
qui sont indiquées sur les côtés du triangle. Ainsi, pour chaque unité spatiale, la position du point à l’intérieur
du triangle indique les proportions relatives des trois variables, et la couleur de ce point est ensuite reportée sur la carte.


## Exemple

<ZoomImg
    src="/example-trichoro-sextant-black-bg.png"
    alt="Exemple de carte choroplèthe trivariée (secteurs d'activités économiques - coloration par sextant)"
    caption="Exemple de carte choroplèthe trivariée (secteurs d'activités économiques - coloration par sextant)"
/>
