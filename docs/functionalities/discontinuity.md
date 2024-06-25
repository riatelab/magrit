# Discontinuités

Les cartes de discontinuités mettent en avant les limites (ou "frontières") entre les entités étudiées, en leur affectant une
épaisseur relative au différentiel de valeur existant entre elles.

Deux méthodes permettent de calculer ce différentiel :

- **discontinuité absolue** : écart absolu entre les valeurs de la variable étudiée c'est à dire `max(A,B) - min(A,B)`
- **discontinuité relative** : écart relatif entre les valeurs de la variable étudiée c'est à dire `max(A,B) / min(A,B)`

La visualisation de lignes de discontinuités permet de mettre en exergue les ruptures spatiales des phénomènes socio-économiques étudiés,
qui, selon la formule de Brunet et Dolphus (1990), montrent que *"l’espace géographique est fondamentalement discontinu"*.

Cette représentation est particulièrement pertinente lorsqu'elle peut être combinée à une représentation par aplats de couleurs (Cf. [carte choroplèthe](./choropleth)).

## Paramètres

- Variable à utiliser
- Type de discontinuité (absolue ou relative)
- Type de discrétisation

Il est possible de modifier, après création de la couche, les paramètres de discrétisation (nombre de classes, méthode de discrétisation, taille associée à chaque classe, etc.).

## Exemples

<ZoomImg
    src="/example-discontinuity.png"
    alt="Exemple de carte de discontinuité"
    caption="Exemple de carte de discontinuité"
/>
