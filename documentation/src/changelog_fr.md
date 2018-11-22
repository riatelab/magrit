# Historique des versions et des changements effectués


#### 0.8.10 (2018-11-22)

- Corrige l'erreur dans la documentation et l'interface en français avec "*semis* de point". (<a href="https://github.com/riatelab/magrit/issues/32">issue Github #32</a>)

- Corrige les valeurs incorrectes de 'REVENUS' et 'REVENUS_PAR_MENAGE' sur le jeu de données du Grand Paris. (<a href="https://github.com/riatelab/magrit/issues/33">issue Github #33</a>)

- Corrige un bug dans l'affichage d'information (comme "20 entrées par page") dans la fenêtre affichant la table de données. (<a href="https://github.com/riatelab/magrit/issues/29">issue Github #29</a>)

- Démarre Gunicorn avec une valeur pour le paramètre "max-requests" pour automatiquement redémarrer les worker et minimiser l'impact d'une éventuelle fuite de mémoire.

- Corrige un bug avec le bouton 'Inverser la palette' dans la boite de dialogue des propriétés des cartes lissées. (<a href="https://github.com/riatelab/magrit/issues/31">issue Github #31</a>)


#### 0.8.9 (2018-10-15)

- Corrige bug de traduction de la page d'acceuil.

- Enlève l'ancien formulaire de contact en faveur du formulaire de contact de site web du RIATE.


#### 0.8.8 (2018-09-21)

- Nouveauté : ajout de templates sur la page d'acceuil.  

- Corrige l'ouverture du dialogue de modification du titre.



#### 0.8.7 (2018-09-10)

- Nouveauté : Permet la découpe de l'export SVG à la limite de la vue actuelle (nouvelle option par défaut).


#### 0.8.6 (2018-08-08)

- Améliore le positionnement du symbole dans la légende des cartes en gaufre.

- Améliore la suite de tests.

- Mise-à-jour de quelques exemples dans la documentation (notamment pour utiliser la projection Lambert-93 sur plusieurs cartes de Paris).


#### 0.8.5 (2018-07-02)

- Nouveauté : la création de légendes (d'un seul item) est possible pour les couches d'habillage.

- Nouveauté : Affichage d'un message de confirmation avant de promouvoir/déclasser une couche (vers/depuis le statut de couche cible).

- Corrige la projection à utiliser lors de la création de cartogrammes de Dougenik.

- Corrige la présence d'un fichier GeoJSON non-souhaité, lors de l'export au format Shapefile, dans l'archive ZIP.

- Corrige le comportement erroné de la barre d'échelle lorsque ses propriétés sont modifiées (+ correction du comportement du bouton "Annulation" de cette boite de dialogue).


#### 0.8.4 (2018-06-08)

- Correction d'une erreur de syntaxe.


#### 0.8.3 (2018-06-08)

- Corrige une erreur se produisant lors de la création de fichiers temporaires pour certaines représentations.


#### 0.8.2 (2018-06-07)

- Corrige la hauteur de l'élément SVG qui acceuile le bar chart dans le fenêtre de discrétisation des liens/discontinuités.

- Modification du code pour permettre l'utilisation d'une instance locale sans redis (et donc permettre l'utilisation plus facile sur Windonws)


#### 0.8.1 (2018-05-22)

- Corrige l'affichage du bar chart dans la fenêtre de discrétisation des cartes choroplèthes.


#### 0.8.0 (2018-05-22)

- Nouveauté : Autorise à "promouvoir" n'importe quelle couche d'habillage (et certaines couches de résultat) vers le statut de couche cible. Cette fonctionnalité permet de combiner plusieurs type de représentations de manière plus simple/rapide et en évitant des suppressions/imports inutiles de couches (rend par exemple possible de faire une carte choroplèthe sur le résultat d'une anamorphose, etc.)

- Change la façon dont sont importées les couches. Un message demande désormais toujours s'il s'agit d'une couche cible ou d'une couche d'habillage.

- Corrige la position de la boite de menu contextuel lorsque ouverte sur des éléments d'habillage situé près du coin inférieur droit de la carte.

- Changement du style de la boite proposant de choisir le type des champs (pour améliorer un peu sa lisibilité).

- Changement de la manière dont est préparé le code JS/CSS (en utilisant désormais webpack).


#### 0.7.4 (2018-04-18)

- Corrige une erreur survenant lors de l'utilisation d'une couche contenant un champ nommé "id" et des valeurs non-uniques dans ce champs (causé, en interne, par le fait que le format geojson est utilisé et que fiona échoue lors de l'ouverture d'un GeoJSON avec des valeurs non-uniques dans ce champs).


#### 0.7.3 (2018-03-21)

- Correction de plusieurs petits bugs dans les styles de l'interface.

- Corrige la valeur de départ de certains éléments "input" de type "range" qui état incorrecte.


#### 0.7.2 (2018-03-19)

- Suppression de la méthode de discrétisation "progression arithmétique".

- Nouveauté: autorise également la création de symboles proportionnels lors de l'analyse d'un semis de points.

- Permet d'utiliser des angles arrondis pour les rectangles utilisés en éléments d'habillage.

- Change légèrement le comportement du zoom lors de l'ajout d'une nouvelle couche de résultat (on ne zoomant plus sur cette dernière).

- Corrige l'option de "zoom à l'emprise de la couche" lors de l'utilisation de la projection Armadillo et d'une couche sur l'emprise du monde.

- Changement de l'implémentation utilisée pour le calcul des potentiels, de manière à utiliser moins de mémoire sur le serveur.


#### 0.7.1 (2018-03-09)

- Correction d'erreurs dans la documentation.

- Nouveauté : ajout d'une option de personnalisation pour la légende des symboles proportionnels, permettant d'afficher une ligne entre le symbole et la valeur.

- Active également l'option d'aide à l'alignement des éléments d'habillage pour les annotations de texte.


#### 0.7.0 (2018-03-05)

- Nouveauté : permet l'analyse d'un semis de points par 2 moyens : via une grille régulière ou un maillage existant. Les informations calculés peuvent être la densité d'item (nombre d'item par km²), pondéré ou non, dans chaque cellule/polygone ou un résumé statistique (moyenne ou écart type) sur les items localisés dans chaque cellule/polygone.


#### 0.6.7 (2018-02-01)

- Corrige un bug avec la création de carte de liens lorsque l'identifiant est un nombre entier.


#### 0.6.6 (2018-01-19)

- Améliore certaines options de style lors de la personnalisation des cartes de liens.

- Corrige un bug se produisant lors de la création de labels lorsque la couche cible contient des géométries nulles (et prévient l'utilisateur si c'est le cas, comme sur les autres type de représentations).


#### 0.6.5 (2018-01-12)

- Change la manière dont sont filtrés les noms utilisés lors de l'export d'une carte (en autorisant maintenant des caractères comme point, tiret ou parenthèses).

- Corrige bug avec l'affiche du message d'attente (ne s'affichait pas lors du chargement d'un fichier TopoJSON).

- Corrige l'affichage des légendes horizontales lors de l'utilisation de la réalisation d'une carte chroroplèthe de catégories + corrige l'affichage de l'arrondi des valeurs pour les légendes des cartes chroroplèthes et symboles proportionnels.

- Corrige un bug survenant lors du changement de nom d'une couche lorsque celle-ci présentait un nom particulièrement long.

- Le calcul de la discrétisation avec l'algo. de Jenks se passe désormais dans un webworker quand la couche contient plus de 7500 entités.


#### 0.6.4 (2017-12-22)

- Change légèrement la manière dont le type des champs est déterminé.

- Améliore l'effet "enfoncé/activé" des boutons situés en bas à gauche de la carte.

- Réduit légèrement la consommation de mémoire coté serveur (en réduisant le TTL des entrées dans Redis et en ne sauvegardant plus, pour une réutilisation plus rapide ensuite, les résultats intermédiaires lors du calcul de potentiels).

- Améliore le nettoyage des noms de champs dans les couches fournis par l'utilisateur.

- Défini de manière explicite les paramètres de locale et de langage lors de la création de l'image Docker.


#### 0.6.3 (2017-12-14)

- Corrige un problème d'encodage avec certains jeux de données d'exemple (bug introduit dans la version 0.6.1).

- Corrige bug survenant lors du chargement de certains jeux de données tabulaires contenant des coordonnées (lorsque les champs contenant les coordonnées contiennent aussi d'autres valeurs).

- Corrige un bug avec la hauteur de ligne dans les annotations de texte lors du rechargement d'un fichier projet.


#### 0.6.2 (2017-12-12)

- Corrige un bug lors de l'ajout de shapefile (en raison d'une erreur avec la fonction de hash utilisée, bug introduit dans la version 0.6.1).


#### 0.6.1 (2017-12-11)

- Nouveauté : ajout d'une nouvelle disposition (horizontale) pour les légendes des cartes choroplèthes.

- Nouveauté : autorise à créer des labels conditionnés par la valeur prise par un champ donné (permettant par exemple de créer une couche de labels sur le champs "nom" d'une couche, lorsque les valeurs du champs "population" sont supérieures à xxx, etc.)

- Correction de bugs survenant lors de l'ajout de couche par l'utilisateur et améliore la détection des fichiers tabulaire contenant des coordonnées.

- Correction de quelques erreurs dans l'interface et amélioration de l'affichage du nom des projections lorsque celles-ci ont viennent d'une chaîne de caractère proj.4.

- Améliore légèrement le support de Edge et Safari.


#### 0.6.0 (2017-11-29)

- Nouveauté : demande à l'utilisateur s'il veut supprimer les entités non-jointes de son fond de carte après une jointure partielle.

- Nouveauté : permet de créer également des liens proportionnels (ie. sans discrétisation).

- Nouveauté : ajout de nouveaux fonds de carte pour la France.


#### 0.5.7 (2017-11-08)

- Corrige des erreurs dans la traduction française de l'interface.

- Corrige un bug empêchant de modifier le nombre de classe lors de l'utilisation d'une palette de couleur de divergente.


#### 0.5.6 (2017-10-31)

- Corrige bug du paramètre de rotation des projections qui n'était pas conservé lors du rechargement d'un fichier projet.


#### 0.5.5 (2017-10-12)

- Corrige un bug dans l'affichage des pictogrammes dans la boite permettant de les sélectionner.


#### 0.5.4 (2017-10-01)

- Changement de la police utilisée par défaut dans les éléments SVG text ou tspan (en faveur du Verdana), afin de corriger un bug se produisant lors de l'ouverture (notamment dans Adobe Illustrator v16.0 CS6 sur MacOSX) d'un SVG généré par Magrit.

- Désactive la possibilité d'ajouter une sphère et le graticule lors de l'utilisation d'une projection Lambert Conique Conforme (le chemin SVG généré n'est pas découpé (avec attribut *clip-path*) lors de l'utilisation de certains projections et ce chemin peut s'avérer très lourd en raison de la nature de la projection).

- Nouveauté : autorise l'annulation de l'ajout d'un élément d'habillage en cours en pressant la touche "Échap".

- Améliore la légende des symboles proportionnels en utilisant également le couleur de fond et la couleur de bordure dans la légendre (seulement lors de l'utilisation d'une couleur unique).

- Nouveauté : ajout de la projection "Bertin 1953" parmi les projections disponibles.


#### 0.5.3 (2017-09-22)

- Changement de la police utilisée par défaut dans les éléments SVG text ou tspan (en faveur du Arial), afin de corriger un bug se produisant lors de l'ouverture (notamment dans Adobe Illustrator v16.0 CS6 sur MacOSX) d'un SVG généré par Magrit.


#### 0.5.2 (2017-09-13)

- Corrige un bug avec la modification du style du graticule.


#### 0.5.1 (2017-09-08)

- Améliore la manière dont les rectangles sont dessinés/édités.

- Correction d'un bug sur le tooltip affichant la chaîne de caractère proj.4 des projections.

- Permet de sélectionner les projections à partir de leur code EPSG et affiche le nom officiel de la projection dans le menu.

- Autorise à réutiliser les couleurs et les labels d'une représentation catégorielle existante.

- Modification de la disposition de la boite permettant d'afficher le tableau de données.


#### 0.5.0 (2017-08-24)

- Nouveauté : autorise la création et l'utilisation (ou réutilisation) de palettes de couleurs personnalisées pour les cartes choroplèthes.

- Nouveauté : autorise à afficher/masquer la tête des flèches.

- Changement notable : certains anciens fichiers-projets pourraient ne plus être chargés à l'identique (ceci étant limité à l'ordre d'affichage des éléments d'habillage qui risque de ne pas être respecté).

- Corrige une erreur avec la personnalisation de la légende (survenant après le changement de nom d'une couche).

- Autorise de nouveau à afficher la table correspondant au jeu de données externe + améliore l'affichage des tables.

- Amélioration (pour certaines représentations) de la gestion des champs contenant des valeurs numériques et des valeurs non-numériques.


#### 0.4.1 (2017-08-14)

- Corrige bug de la couleur du fond de l'export SVG.

- Corrige bug de la boite de dialogue ne s'ouvrant pas correctement pour le choix des pictogrammes.

- Changement de comportement avec le découpage SVG (*clipping path*) : n'est plus appliqué aux couches de symboles proportionnels ni aux couches de pictogrammes.

- Modification du message apparaissant lors du chargement d'une couche ou de la réalisation de certains calculs.


#### 0.4.0 (2017-07-24)
------------------

- Corrige une erreur apparaissant sur certaines représentations lors du l'utilisation d'une couche cible dont la géomtrie de certaines entités est nulle (et prévient l'utilisateur si c'est le cas).

- Nouveauté: Ajout d'un nouveau type de représentation, les cartes en gaufres (*waffle map*) permettant de représenter conjointement deux (ou plus) stocks comparables.


#### 0.3.7 (2017-07-17)
------------------

- Corrige une erreur sur les jointures.

- Corrige la position du carré rouge qui apparaît lors du déplacement des symboles proportionnels.

- Corrige la taille des symboles en légendes pour les cartes de lien et de discontinuités (lorsque la carte est zoomée).


#### 0.3.6 (2017-06-30)
------------------

- Corrige l'option de sélection sur les cartes de liens (elle ne fonctionnait qu'avec certains noms de champs).


#### 0.3.5 (2017-06-28)
------------------

- Autorise le déplacement des symboles proportionnels (générés sur les centroides des polygones).

- Change légérement le comportement de la carte avec les projections utilisant proj4 lorsque des couches sont ajoutées/supprimées.


#### 0.3.4 (2017-06-22)

- Corrige le bug de la fonctionnalité "d'alignement automatique" pour les nouvelles annotations de texte.

- Corrige le bug du graticule ne s'affichant pas correctement lors de l'ouverture d'un fichier SVG dans Adobe illustrator.

- Corrige le but des jointures qui échouaient depuis la version 0.3.3.

- Nouveau: Autorise le changement de nom des couches à tout moment.


#### 0.3.3 (2017-06-15)

- Autorise l'ajout de plusieurs sphères (<a href="https://github.com/riatelab/magrit/issues/26">issue Github #26</a>)

- Ajout de projections adaptées par défaut pour les couches d'exemple (Lambert 93 pour le Grand Paris, etc.)


#### 0.3.2 (2017-06-09)

- Corrige le comportement des annotations de texte lorsque le bouton "annulation/cancel" est cliqué.

- Corrige le bug de la légende qui affiche "false" après le rechargement d'un projet.

- Échange des couleurs entre les boutons "OK" et "Annulation" dans les boites de dialogue.


#### 0.3.1 (2017-06-08)

- Correction d'une erreur dans la récupération des valeurs lors de la création d'un cartogramme.


#### 0.3.0 (2017-06-07)

- Correction de bugs dans la lecture des fichiers CSV : meilleur support de certains encodages + corrige erreur lors de la lecture de fichier dont la première colonne contient un nom vide.

- Ajout d'une fonctionnalité permettant de sélectionner l'alignement (gauche, centré, droite) du texte dans les annotations de texte.

- Changement dans le numérotage des versions (afin de suivre les règles du SemVer)

- Correction d'un bug concernant la projection Lambert 93, accessible depuis de le manu d'accès rapide aux projections (l'affichage était inexistant à certains niveaux de zoom)

- Suppression de deux projections pouvant être considérées comme redondantes.

- Correction d'un bug dans le choix de la taille des pictogrammes.

- Correction d'un bug concernant l'ordre dans lequel les éléments d'habillage sont affichés lors du rechargement d'un projet.
