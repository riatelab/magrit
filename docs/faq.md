# Questions fréquemment posées

#### - Quel logiciel pour modifier des fichiers SVG afin de finaliser une carte créée dans Magrit ?

Il est possible d'utiliser des logiciels de bureau de dessin vectoriel tels que [Inkscape](https://inkscape.org/) (libre et gratuit - c'est celui que nous recommandons)
ou [Adobe Illustrator](https://www.adobe.com/fr/products/illustrator.html) pour modifier des fichiers SVG.

Il existe également des applications en ligne qui permettent de modifier des fichiers SVG, comme [SVG-Edit](https://svg-edit.github.io/svgedit/) ou [Method Draw](https://editor.method.ac/).

#### - Pourquoi le rendu de certains exports SVG n'est pas le même dans Inkscape / Adobe Illustrator que lors de l'affichage de la carte dans Magrit ?

Lors de la création d'une carte, si vous sélectionnez une des polices de caractères proposées dans Magrit (autre que les familles de polices du système d'exploitation de l'utilisateur telles que *Serif*, *Sans-Serif* et *Monospace*),
il est possible que le rendu de la carte ne soit pas le même dans un logiciel de dessin vectoriel (comme Inkscape ou Adobe Illustrator) que dans Magrit.

Cela est dû au fait que les polices de caractères utilisées dans Magrit ne sont pas installées sur votre machine et que le logiciel de dessin vectoriel ne peut donc pas les afficher correctement.
Vous pouvez toutefois vérifier que la carte contient bien les polices de caractères utilisées dans Magrit en ouvrant le fichier SVG dans un navigateur Web.

Pour résoudre ce problème, vous pouvez télécharger les polices de caractères utilisées dans votre carte et les installer sur votre machine.

Voir la réponse à la question suivante concernant l'origine des polices utilisées et la manière de les télécharger et les installer sur votre machine.

#### - Quelles sont les polices d'écritures proposées dans Magrit ? Quelles sont leurs licences ?

Les polices d'écritures proposées dans Magrit sont les suivantes :

- Montserrat
- Open Sans
- Roboto
- Great Vibes
- Lato
- Pacifico
- Amatic
- Oswald
- Lobster
- Playfair Display
- Dosis
- League Gothic

Il s'agit de polices gratuites et libres de droit (d'après la revue qui en a été faite par [Font Squirrel](https://www.fontsquirrel.com/)).
Elles peuvent être utilisées librement pour des projets personnels ou commerciaux et peuvent aussi bien être incluses dans des applications
(comme c'est le cas dans Magrit) que dans des documents / images / etc.

Par ailleurs, il est possible de sélectionner les familles de polices du système d'exploitation de l'utilisateur lors de la création d'une carte : *Serif*, *Sans-Serif* et *Monospace*.

#### - Pourquoi n'est-il pas possible d'afficher un fond de carte type "OpenStreetMap" dans Magrit ?

L'équipe de développement de Magrit a fait le choix de ne pas intégrer de fond de carte type "OpenStreetMap" directement dans l'application pour l'instant pour plusieurs raisons :

- **Dépendance à un service tiers** : afficher un fond de carte "OpenStreetMap" nécessite de faire appel à un service tiers (le serveur d'OpenStreetMap, ou d'un autre fournisseur) pour récupérer les tuiles de la carte.
  Cela implique une dépendance à ce service tiers, qui peut être lent ou indisponible et nécessite dans tous les cas une connexion à Internet.

- **Conserver l'esprit de l'application** : Magrit est une application de cartographie thématique qui permet de créer et exporter des cartes personnalisées à partir de données géographiques.
  L'objectif est de mettre en avant les données de l'utilisateur et de lui permettre de les représenter de manière claire et efficace.
  L'ajout d'un fond de carte "OpenStreetMap" risquerait de détourner l'attention de l'utilisateur de ses propres données et pourrait rendre la carte plus complexe à lire.
  Par ailleurs, cela conduirait probablement à la création de cartes utilisant la projection Mercator dans des cas où cela n'est pas le plus approprié.

Il existe des applications dédiées à la création de cartes sur un fond de carte "OpenStreetMap" (comme [uMap](https://umap.openstreetmap.fr/fr/))
qui permettent de réaliser facilement des cartes avec des épingles, des boites d'informations affichées au clic, etc.

#### - Les performances de l'application semblent dégradées lors de l'utilisation de certains jeux de données ou lors de l'ajout de nombreux jeux de données ?

Magrit utilise la technologie SVG pour afficher les cartes créées par l'utilisateur.

Cette technologie est très performante pour des cartes de taille modérée mais peut montrer ses limites lorsque les cartes deviennent très complexes (nombreux jeux de données, nombreuses entités, géométries très détaillées, etc.).

Si vous constatez des ralentissements lors de l'utilisation de Magrit, voici quelques pistes pour améliorer les performances :

- **Simplifier les données** : si vous utilisez des données très détaillées (par exemple des polygones avec de nombreux sommets), essayez de les simplifier lors de l'import dans Magrit (avec l'option proposée) ou avant de les importer dans Magrit.
  Vous pouvez utiliser un outil de simplification de géométries comme [Mapshaper](https://mapshaper.org/) pour réduire le nombre de sommets des polygones tout en conservant l'essentiel de l'information.

- **Réduire le nombre de jeux de données affichés** : si vous avez de nombreux jeux de données affichés simultanément, essayez de masquer (avec le bouton dédié dans la gestionnaire de couches)
  les couches qui ne sont pas utilisées (par exemple, après création d'une carte choroplèthe, vous pouvez masquer les données brutes qui ont servi à la création de la carte puisqu'elles sont désormais recouvertes par la nouvelle couche créée).

- **Réduire le nombre d'entités affichées** : si vous avez de nombreuses entités dans vos jeux de données, essayez de filtrer les données pour n'afficher que celles qui sont nécessaires à la création de votre carte.
  Par exemple, si vous avez un jeu de données de communes en France et que vous n'avez besoin que des communes d'un département, filtrez les données (avec la fonctionnalité de sélection de Magrit) pour ne garder que les communes de ce département.

L'équipe de développement de Magrit travaille par ailleurs à améliorer les performances d'affichage de l'application et à proposer des solutions pour gérer des jeux de données plus importants (utilisation de la technologie Canvas ou WebGL par exemple).
