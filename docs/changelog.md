# Historique des changements

<br />

#### 2.0.8 (2024-08-27)

- Correction de la valeur affichée pour les barres d'échelles (Corrige <a href="https://github.com/riatelab/magrit/issues/137">137</a>).

- Ajout d'une fonctionnalité permettant de recharger directement un fichier projet à partir d'une URL distance (voir documentation pour plus de détails).

- Déactive le bouton pour ouvrir la fenêtre d'import tant que GDAL n'a pas fini de charger.

#### 2.0.7 (2024-07-31)

- Réintroduction de la publication d'une image sur le Docker Hub à chaque nouvelle version.

- Ajout de la possibilité de définir une projection personnalisée via une chaîne WKT ou proj4
  (Corrige <a href="https://github.com/riatelab/magrit/issues/133">133</a>).

- Amélioration des composants permettant de définir les paramètres des axes d'une projection (pour permettre une saisie plus précise des valeurs).

#### 2.0.6 (2024-07-12)

- Ajout d'une fonctionnalité permettant d'afficher la moyenne, la médiane et la population sur l'histogramme
  affiché sur la carte pour les représentations choroplèthes.

- Ajout de nouveaux jeux de données d'exemple par [@rysebaert](https://github.com/rysebaert) :
  - Communes de France métropolitaine,
  - Communes de France métropolitaine + DROM,
  - Communes de France métropolitaine + DROM dans des encarts (pour permettre de représenter facilement France métropolitaine + DROM dans une même carte).

#### 2.0.5 (2024-07-10)

- Correction d'un bug avec la méthode de classification de la moyenne et de l'écart-type (lorsque la moyenne est demandée comme limite de classe). Correction en amont  dans [mthh/statsbreaks](https://github.com/mthh/statsbreaks).

- Permettre d'afficher la population (*rug plot*) sur le graphique de discrétisation du panneau de discrétisation.

- Améliore la couleur du tracé de la boite à moustache (en particulier lors de l'utilisation du thème sombre) dans le panneau de discrétisation.

- Changement des liens vers l'ancienne version de Magrit dans la documentation.

#### 2.0.4 (2024-07-08)

- Corrige la topologie des jeux de données d'exemple NUTS (Corrige partiellement <a href="https://github.com/riatelab/magrit/issues/127">127</a>)
  ainsi que les métadonnées associées.

- Meilleure gestion des géométries nulles après intersection lors de la création de grilles (Corrige partiellement <a href="https://github.com/riatelab/magrit/issues/127">127</a>).

- Améliore le premier rendu de l'application (problème résolu cette fois).

#### 2.0.3 (2024-07-05)

- Améliore le premier rendu de l'application.

#### 2.0.2 (2024-07-05)

- Ne faire le rendu de la page qu'après que la feuille de style ait été chargée pour éviter un flash de contenu non-stylé.

#### 2.0.1 (2024-07-05)

- Correction de fautes d'orthographe / mauvaise formulation dans la traduction française.
- Correction du zoom lors de l'ajout d'un jeu de données d'exemple lorsqu'il s'agit de la première couche ajoutée à l'application
  (Corrige <a href="https://github.com/riatelab/magrit/issues/128">128</a>).
- Changement du nom du champ spécial `$length` vers `$count` dans le composant de formules SQL-like pour éviter le risque de confusion
  (Corrige <a href="https://github.com/riatelab/magrit/issues/130">130</a>).

### 2.0.0 (2024-07-04)

Il s'agit d'une refonte totale de l'application (aussi bien concernant son architecture que son interface utilisateur).
La liste exacte des changements est trop longue pour être listée de manière explicite ici, mais voici quelques points importants :

- Nouvelle interface utilisateur (thème sombre, etc.)
- Nouvelle architecture (utilisation de Solid.js, plus de serveur Python : toutes les opérations sont effectuées dans le navigateur)
- Nouvelles fonctionnalités (aggrégation, sélection, simplification, KDE, régression linéaire, etc.)
- La possibilité de télécharger une version autonome de l'application (sans avoir besoin de connexion internet pour l'utiliser)

Les fonctionnalités de l'ancienne version de Magrit sont toujours disponibles
(les différents types de représentation, l'export PNG / SVG, l'export de fichier projet, etc.).


---

#### 0.16.6 (2024-06-03)

- Mise à jour de la page d'accueil.

#### 0.16.5 (2024-05-04)

- Mise à jour de `aiohttp` pour corriger plusieurs problèmes de sécurité avec la version anciennement utilisée.

#### 0.16.4 (2024-03-20)

- Correction de certains liens vers la documentation pour l'utilisation dans docker (cf. discussion dans <a href="https://github.com/riatelab/magrit/issues/115">115</a>).

- Meilleure formulation du message d'erreur dans la fenêtre modale de jointure (corrige <a href="https://github.com/riatelab/magrit/issues/123">123</a>).

- Correction de l'alignement des éléments (dans chaque ligne) dans le panneau de sélection des couleurs pour les catégories.

#### 0.16.3 (2023-07-12)

- Correction de la sauvegarde de la palette personnalisée lors du clic sur confirmer dans le popup dédié du panneau de discrétisation (<a href="https://github.com/riatelab/magrit/issues/117">cf. issue #117</a>)

- Amélioration de la taille de certains éléments HTML pour les palettes personnalisées qui étaient trop petits.

- Correction de l'alignement vertical des noms de champs dans les options de création des labels (merci à @robLittiere).

- Correction du débordement des noms de champs dans les options de création des labels (merci à @robLittiere).

- Éviter de rembobiner automatiquement les cartogrammes issue de l'algo de Gastner, Seguy et More.

- Suppression des CSS inutiles de la page 404 (qui incluait le chargement d'une police provenant de Google Fonts).

#### 0.16.2 (2023-05-12)

- Corrige la position des points rouges indiquant la position d'origine du label lors du déplacement d'un label.

#### 0.16.1 (2023-05-11)

- Amélioration de la compatibilité entre la nouvelle gestion et l'ancienne gestion de la position des labels déplacés manuellement lors du chargement d'un fichier de projet créé avec une version antérieure à 0.16.0.

#### 0.16.0 (2023-05-11)

- Désactivation du zoom par sélection rectangulaire lors d'un changement de projection s'il est activé.

- Amélioration de la gestion des positions des étiquettes en évitant de réinitialiser la position des étiquettes lors d'un changement de projection pour les étiquettes qui ont été déplacées manuellement.

- Éviter de réinitialiser la position des étiquettes lors de l'export en SVG avec l'option "Découper le SVG sur l'emprise actuelle".

- Modification des règles CSS pour les couches cachées (car Inkscape ne supporte pas l'attribut "visibility" sur les éléments SVG ni la propriété CSS "visibility").

- Chargement des pictogrammes dès le chargement de l'application au lieu de différer le chargement à la première ouverture du "panneau des pictogrammes" (cela causait des problèmes avec les connexions réseau lentes, car les pictogrammes n'étaient pas chargés lorsque l'utilisateur essayait de les utiliser - voir <a href="https://github.com/riatelab/magrit/issues/110">issue #110</a>).

#### 0.15.3 (2023-04-14)

- Correction des liens vers les images dans les sous-chapitres de la documentation.

#### 0.15.2 (2023-04-13)

- Correction du comportement "mouseup" lors du dessin d'un rectangle (le curseur continuait à déplacer la carte après avoir dessiné le rectangle, même après avoir relâché le clic).

- Correction du comportement "mouseup" lors d'un zoom avec une sélection rectangulaire (le curseur continuait à déplacer la carte après avoir dessiné le rectangle, même après avoir relâché le clic).

#### 0.15.1 (2023-04-11)

- Transfère la valeur d'opacité des couches (choroplèthe, etc.) à leurs légendes.

#### 0.15.0 (2023-04-06)

- Correction d'un bug avec les géométries nulles / vides introduit dans le commit 326e3c8 / version 0.13.2.

- Amélioration du popup de création d'étiquettes pour permettre la création de plusieurs étiquettes à la fois, tout en étant capable de sélectionner la police et la taille de la police pour chaque champ.

- Empiler automatiquement les étiquettes pour chaque entité afin d'éviter les chevauchements (merci à @robLittiere et à @ArmelVidali pour la contribution <a href="https://github.com/riatelab/magrit/pull/109">contribution #109</a>).

- Mise à jour de la dépendance `smoomapy` pour corriger un problème lorsque les limites données par l'utilisateur sont très proches des limites min/max des données (et que cela pouvait résulter en une classe sans valeur).

#### 0.14.1 (2023-03-29)

- Correction de l'emplacement des étiquettes dérivées d'une couche de symboles proportionnels déplacés pour éviter les chevauchements (dorling/demers) (<a href="https://github.com/riatelab/magrit/issues/108">cf. issue #108</a>). Fonctionne également sur les symboles qui ont été déplacés manuellement.

- Correction de la description de deux jeux de données d'exemple (Départements et Régions) où le champ "CODGEO" était décrit comme s'appelant "CODEGEO", empêchant d'effectuer certaines représentations sur le champ "CODGEO".


#### 0.14.0 (2023-03-24)

- Nouveau : Ajout d'une fonctionnalité permettant le filtrage d'une ou plusieurs catégories lors de la création d'une couche de pictogrammes (merci à @robLittiere et à @ArmelVidali pour la contribution <a href="https://github.com/riatelab/magrit/pull/106">contribution #106</a>).

- Nouveau : Ajout d'une fonctionnalité permettant d'ajouter une légende aux couches de labels (<a href="https://github.com/riatelab/magrit/issues/107">cf. issue #107</a>)

- Correction de fautes d'orthographe dans la traduction française.


#### 0.13.4 (2023-03-14)

- Modification de la recette docker pour permettre la création et la publication sur docker hub d'images multi-plateformes (amd64 / arm64).

#### 0.13.3 (2023-02-21)

- Essayer d'améliorer le rembobinage des anneaux des polygones puisque certains problèmes existants n'ont pas été résolus (#104) et que de nouveaux problèmes sont apparus (#105).

- Corrige un bug empêchant de charger des couches cibles qui n'ont aucun champ d'attribut.

#### 0.13.2 (2023-02-17)

- Rembobine les anneaux des polygones avant d'afficher les couches dans la carte (pour éviter certains problèmes de rendu avec certaines géométries et d3.js).

#### 0.13.1 (2023-01-05)

- Mise à jour de go-cart-wasm pour utiliser la version 0.3.0 (corrige un problème de boucle infinie sur certains jeux de données)

- Améliore la gestion de l'overlay en cas d'erreur lors du calcul des cartogrammes de Gastner, Seguy et More.

- Corrige un DeprecationWarning lors de la reprojection de certaines géometries.

#### 0.13.0 (2023-01-04)

- Correction d'un bug qui empêchait de faire certaines représentations cartographiques après avoir promu une couche d'habillage en couche cible.

- Nouveau : Ajout d'une option permettant d'utiliser la méthode de Gastner, Seguy et More (2018) pour calculer les cartogrammes (seulement disponible dans les navigateurs qui supportent WebAssembly).

#### 0.12.1 (2022-12-06)

- Corrige un ancien bug sur le chargement des ficher-projets générés avec les premières versions de Magrit vers 2017 (avant la version 0.3.0, ne contenant pas d'informations relatives à la version utilisée pour générer le fichier-projet en question).

- Corrige un bug lors de l'import des geopackages lors du clic sur "Ajout d'un fond de carte" (l'import fonctionnait seulement quand le fichier était glissé-déposé sur la carte).

#### 0.12.0 (2022-11-30)

- Nouvelle fonctionnalité : Permet le chargement des couches vecteur contenues dans des fichiers GeoPackage.

- Correction d'un attribut HTML manquant qui empêchait la retraduction d'une infobulle.

- Correction de l'ordre des coordonnées lors de l'export vers certains SRC / formats de fichier.

- Améliore le positionnement des titres de légendes des symboles proportionnels.

- Améliore le positionnement des différents éléments dans la boite d'édition des légendes.

- Mise à jour des dépendances pour permettre d'utiliser Python 3.11 et mise à jour des recettes Docker pour utiliser Python 3.11.

#### 0.11.1 (2022-11-08)

- Corrige l'absence de traduction pour les noms des projections ajoutées dans la v0.11.0.

#### 0.11.0 (2022-11-03)

- Nouvelle fonctionnalité : Ajout d'une option pour éviter le chevauchement des symboles proportionnels (<a href="https://github.com/riatelab/magrit/issues/77">issue Github #77</a>)

- Mise à jour des templates cartographiques disponibles sur la page d'accueil (merci à Ronan Ysebaert pour la préparation et la mise à disposition des données).

- Mise à jour des jeux de données NUTS (version 2020).

- Mise à jour des jeux de données de la France Métropolitaine (pour utiliser une version basée sur des polygones de voronoi calculés à partir des centroides des communes de la version ADMIN-EXPRESS-COG 2022).

- Ajout de nouvelles projections cartographiques à partir de d3-geo-projection : *Interrupted Quartic Authalic*, *Interrupted Mollweide Hemispheres*, *PolyHedral Butterfly*, *Polyhedral Collignon*, *Polyhedral Waterman*, *Hammer*, *Eckert-Greifendorff* (basée sur `d3.geoHammer`), *Quartic Authalic* (basée sur `d3.geoHammer`) and *Spilhaus* (basée sur `d3.geoStereographic`).

#### 0.10.1 (2022-10-13)

- Correction d'un bug qui empêchait de créer carte de typologie (Typo, PropSymbolTypo et TypoPicto) avec des données de type 'Number' (erreur introduite dans la version 0.10.0).

#### 0.10.0 (2022-10-07)

- Modifie la façon dont est proposée l'option "palette personnalisée" dans le panneau de classification (<a href="https://github.com/riatelab/magrit/issues/78">issue Github #78</a>).

- Améliore le CSS du panneau de classification.

- Améliore le rendu de l'histogramme dans le panneau de classification.

- Tri alphabétique des catégories 'typo' et 'picto' par défaut.

- Améliore le positionnement des *waffles* dans la carte en gaufres (de sorte que le centre du bloc de gaufres tombe sur le centroid sur l'axe X, au lieu du comportement jusqu'à présent le coin inférieur droit tombait sur le centroid).

- Lit les champs en tant que chaîne de caractères lors de l'import de fichier GML (suite à un rapport de bug par email).

- Lit le CRS du fichier GML pour le transférer à l'UI et demande à l'utilisateur s'il doit être utilisé.

- Correction de l'ordre des coordonnées (en utilisant l'option OAMS_TRADITIONAL_GIS_ORDER de OSR) lors de l'export vers ESRI Shapefile et GML.

- Dans PropSymbolTypo, ne pas faire apparaître dans la légende les catégories qui n'apparaissent pas sur la carte en raison de valeurs nulles ou égales à 0 dans le champ utilisé pour dessiner le symbole proportionnel (<a href="https://github.com/riatelab/magrit/issues/93">issue Github #93</a>).

- Mise à jour de quelques noms de pays dans le fichier d'exemple "Pays du monde".

- Mise à jour de toutes les dépendances `d3.js`.

#### 0.9.2 (2022-09-08)

- Corrige le positionnement des waffles (<a href="https://github.com/riatelab/magrit/issues/87">issue Github #87</a>)

#### 0.9.1 (2022-08-31)

- Corrige le positionnement des labels lors de la réouverture d'un fichier projet s'ils avaient été déplacés manuellement (<a href="https://github.com/riatelab/magrit/issues/86">issue Github #86</a>).


#### 0.9.0 (2022-08-31)

- Implémentation d'un tampon de texte pour les couches de labels (<a href="https://github.com/riatelab/magrit/issues/79">issue Github #79</a>).

- Améliorer le rendu de tous les tampons de texte (titre, annotation de texte et couche d'étiquette) en utilisant les attributs `stroke`, `stroke-width` et `paint-order`.

- Améliorer la détection de la police d'écriture actuelle lors de la réouverture de la fenêtre contextuelle de style pour le titre et l'annotation de texte.

- Corrige l'import des fichiers `xlsx` (<a href="https://github.com/riatelab/magrit/issues/85">issue Github #85</a>).

#### 0.8.15 (2022-08-26)

- Ajout d'une fonctionnalité permettant d'exporter les données de chaque couche au format CSV (<a href="https://github.com/riatelab/magrit/issues/75">issue Github #75</a>).

- Correction de la légende non visible sur la carte des liens proportionnels sur Firefox (<a href="https://github.com/riatelab/magrit/issues/74">issue Github #74</a>)

- Correction du positionnement des symboles et labels lorsque le centroïde ne tombe pas à l'intérieur du polygone cible : il essaie maintenant de calculer le pôle d'inaccessibilité ou s'il ne trouve toujours pas de point dans le polygone, le point le plus proche du centroïde sur le bord du polygone (<a href="https://github.com/riatelab/magrit/issues/63">issue Github #63</a>)

- Mise à jour de nombreuses dépendances pour faciliter l'installation avec un Python récent (tel que 3.10) sur un système récent (tel que ubuntu 22.04).

- Mise à jour des recettes Docker.

- Mise à jour de la documentation à propos de la possibilité de promouvoir les couches d'habillage en couche cible (<a href="https://github.com/riatelab/magrit/issues/36">issue Github #36</a>)

- Correction d'erreurs dans les traductions de l'interface.

- Amélioration du style de certains boutons.

- Amélioration du style des fenêtres permettant de changer le style des couches et le styles des éléments d'habillage.

#### 0.8.14 (2022-03-16)

- Corrections dans la documentation.

- Suppression de la page de contact.

- Correction d'un usage incorrect de `concurrent.futures.ProcessPoolExecutor` + kill les processus qui hébergent des calculs qui durent plus de 5min.


#### 0.8.13 (2020-11-27)

- Remplace `cascaded_union` par `unary_union` dans le code Python et tentative de mieux gérer les géométries en entrée qui comportent des erreurs.

- Attribut shape-rendering lors de la création des cartes lissées.


#### 0.8.12 (2020-11-26)

- Permet une personnalisation plus simple des jeux de couches d'exemple lors du déploiement de Magrit.

- Correction de quelques fautes dans la documentation.

- Désactivation de l'antialiasing lorsque que la bordure d'une couche a une épaisseur de 0 ou une opacité de 0 (permet de vraiment afficher la couche sans bordures, au détriment de la qualité de l'affichage).

- Évite l'apparition de l'overlay gris (dédié au dépot de fichier) lorsque que certains éléments de l'interface sont déplacés (réorganisation des couches ou réorganisation des modalités d'une couche par exemple).

- Définition correcte de l'attribut "lang" des pages HTML pour éviter d'avoir la traduction automatique de Chrome proposée lorsque ce n'est pas utile.

- Améliore le retour d'un message d'erreur vers l'utilisateur lorsque la conversion d'un fichier tabulaire échoue.

- Évite de proposer la réutilisation d'un style existant pour les cartes qualitatives lorsque que seul le style de la couche actuelle existe.

- Change la manière dont est signalée qu'il est possible de réorganiser les modalités des cartes qualitatives et de cartes de symboles.


#### 0.8.11 (2019-03-20)

- Permet de spécifier une adresse pour créer le serveur.

- Corrige l'opération de jointure utilisant un webworker (see #38).

- Remplace certains chemins absolus.

- Nouvelle version de webpack/webpack-cli.

- Corrige l'alignement de l'élément proposant la couleur de fond dans la fenêtre de style des couches d'habillage.

- Améliore le style de la fenêtre de propriétés de la flèche nord (taille des sliders, suppression du titre dupliqué).

- Corrige la valeur initial du slider de l’opacité de la bordure dans la fenêtre de propriétés des cartes lissées.

- Corrige la largeur de la fenêtre de propriétés pour les pictogrammes (pour qu'elle ait la même taille que celle des autres éléments : flèche, ellipse, etc.).

- Corrige l'alignement des éléments dans la fenêtre de jointure des données.

- Ajoute de l'espace entre les éléments dans la fenêtre de discrétisation pour les options de palettes divergentes.

- Corrige plusieurs erreurs récurrentes en français (selection -> sélection; fleche -> flèche; charactère -> caractère) et en anglais (Proportionnal -> Proportional).


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