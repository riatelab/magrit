# Tutoriel - Premier pas avec Magrit
# Utilisation de données personnelles

Nous allons réaliser une carte thématique simple avec Magrit en utilisant vos propres données.

Cela permettra de découvrir les fonctionnalités de base de l'application (import des données, réalisation d'une jointure, affichage du tableau de données, choix d'une représentation, habillage de la carte et export de la carte).

Pour cela nous allons réaliser une carte de l'abstention au second tour de l'élection législative de 2022, à Grenoble et par bureau de vote.

<ZoomImg
    src="/tuto2-fin.png"
    alt="Carte 'Grenoble - Abstention au second tour des élections législatives de 2022'"
    caption="Carte 'Grenoble - Abstention au second tour des élections législatives de 2022'"
/>

## 1. Récupération des données

### 1.1 Récupération du fond de carte

La <a href="http://data.metropolegrenoble.fr/" >plateforme Open Data de la Métropole de Grenoble</a>
met à disposition de nombreux jeux de données, parmi lesquels le découpage des bureaux de vote de la Ville de Grenoble :
<a href="https://data.metropolegrenoble.fr/visualisation/information/?id=les-bureaux-de-vote" target="_blank" rel="noopener noreferrer">https://data.metropolegrenoble.fr/visualisation/information/?id=les-bureaux-de-vote</a>

<ZoomImg
    src="/tuto2-1.png"
    alt="Page 'Découpage des bureaux de vote de la Ville de Grenoble'"
    caption="Page 'Découpage des bureaux de vote de la Ville de Grenoble'"
/>


Plusieurs formats d'export (sous forme de fichiers géographiques) sont disponibles (GeoJSON, Shapefile, KML) et sont tous compatibles avec Magrit.
Nous utiliserons le fichier GeoJSON pour cet exemple.

<ZoomImg
    src="/tuto2-2.png"
    alt="Téléchargement du fichier GeoJSON des bureaux de vote de Grenoble"
    caption="Téléchargement du fichier GeoJSON des bureaux de vote de Grenoble"
/>

### 1.2 Récupération des résultats des élections législatives de 2022

Les résultats des élections législatives de 2022 sont également disponibles sur la plateforme Open Data de la Métropole de Grenoble : <a href="https://data.metropolegrenoble.fr/visualisation/information/?id=resultats_des_elections_legislatives_de_la_ville_de_grenoble" target="_blank" rel="noopener noreferrer">https://data.metropolegrenoble.fr/visualisation/information/?id=resultats_des_elections_legislatives_de_la_ville_de_grenoble</a>

<ZoomImg
    src="/tuto2-3.png"
    alt="Page 'Résultats des élections législatives de la Ville de Grenoble'"
    caption="Page 'Résultats des élections législatives de la Ville de Grenoble'"
/>

Dans l'onglet "Export", nous allons choisir la table nommée "elections_lgislatives_2022_tour_2.csv" et la télécharger au format CSV.

<ZoomImg
    src="/tuto2-4.png"
    alt="Téléchargement du fichier CSV des résultats des élections législatives de Grenoble"
    caption="Téléchargement du fichier CSV des résultats des élections législatives de Grenoble"
/>

## 2. Import des données dans Magrit

Plusieurs manières d'importer des données sont possibles dans Magrit (glisser-déposer ou ouverture du menu d'import puis sélection des fichiers).

Nous allons ici ouvrir la fenêtre d'import des données (accessible depuis le menu latéral gauche), puis sélectionner les deux fichiers téléchargés précédemment :
- le fichier GeoJSON des bureaux de vote (`decoupage_bureau_vote_epsg4326.geojson`),
- le fichier CSV des résultats des élections législatives (`elections_lgislatives_2022_tour_2.csv`).

<ZoomImg
    src="/tuto2-5.gif"
    alt="Import des données dans Magrit"
    caption="Import des données dans Magrit"
/>

Après avoir cliqué sur "Importer les 2 jeux de données", on peut les voir apparaître dans le gestionnaire de couche de Magrit.
La carte s'est également centrée automatiquement sur l'emprise du fond de carte importé.

Il est désormais possible de cliquer sur le bouton "Table attributaire" pour le fond de carte comme pour le jeu de données.

<ZoomImg
    src="/tuto2-6.png"
    alt="Table attributaire des bureaux de vote"
    caption="Table attributaire des bureaux de vote"
/>

Nous identifions dans la table attributaire du fond de carte des bureaux de vote les colonnes suivantes :
- `dec_bureau_vote_num` : le code du bureau de vote,
- `dec_bureau_vote_exist` : l'existence du bureau de vote à la date des dernières élections (1 si le bureau de vote existe, 0 sinon),


<ZoomImg
    src="/tuto2-7.png"
    alt="Table attributaire des résultats des élections législatives"
    caption="Table attributaire des résultats des élections législatives"
/>

Nous identifions dans la table des résultats des élections législatives les colonnes suivantes :
- `code_du_bureau` : le code du bureau de vote,
- `pourcentage_d_abstentions` : le pourcentage d'abstention au second tour de l'élection législative 2022.

## 3. Préparation des données

### 3.1 Sélection des bureaux de vote actuels

Le fond de carte des bureaux de vote contient des bureaux de vote qui n'existent plus à la date des dernières élections (il s'agit d'un jeu de données contenant l'historique des découpages des bureaux de vote).

Afin de sélectionner seulement les bureaux de vote actuels, nous allons opérer à une **sélection attributaire** sur la couche des bureaux de vote.

<ZoomImg
    src="/tuto2-8.gif"
    alt="Ouverture de la fonctionnalité de sélection attributaire"
    caption="Ouverture de la fonctionnalité de sélection attributaire"
/>

Cette fonctionnalité permet d'effectuer une sélection attributaire en utilisant une expression SQL-like.
Les entités qui satisfont l'expression sont sélectionnées pour la création d'une nouvelle couche. Il est également nécessaire, dans cette fenêtre, de renseigner un nom pour la nouvelle couche.

<ZoomImg
    src="/tuto2-9.png"
    alt="Sélection attributaire des bureaux de vote actuels"
    caption="Sélection attributaire des bureaux de vote actuels"
/>

Une fois la couche créée, elle apparaît dans le gestionnaire de couche de Magrit et sur la carte, au dessus des autres couches.
Il est désormais possible de désactiver la couche des bureaux de vote historiques.

<ZoomImg
    src="/tuto2-10.png"
    alt="Vue de l'interface après création de la nouvelle couche et désactivation de la couche historique"
    caption="Vue de l'interface après création de la nouvelle couche et désactivation de la couche historique"
/>

### 3.2 Jointure des données

Nous allons maintenant réaliser une jointure entre la couche des bureaux de vote actuels et la table des résultats des élections législatives en se basant sur
le champ commun (c'est-à-dire qu'il est présent dans les deux tables à joindre) contenant le code du bureau de vote.

<ZoomImg
    src="/tuto2-11.png"
    alt="Accès à la fonctionnalité de jointure"
    caption="Accès à la fonctionnalité de jointure"
/>

Dans la fenêtre qui s'ouvre, il est nécessaire de faire plusieurs choix :
- à quel fond de carte joindre la table ? (ici, la couche des bureaux de vote actuels, créée plus tôt et nommée `Grenoble_bureau_vote_2022`),
- quel champ de la table joindre à quel champ du fond de carte ? (ici, `code_du_bureau` de la table des résultats des élections législatives avec `dec_bureau_vote_num` de la couche des bureaux de vote actuels).

Une fois ces choix effectués, il est possible de voir si des correspondances ont bien été trouvées entre les deux jeux de données. Ici, on peut voir que tous les bureaux de vote du fond de carte
ont trouvé une correspondance dans la table des résultats des élections législatives.
Il est ensuite possible de valider la jointure en cliquant sur "Confirmation".

<ZoomImg
    src="/tuto2-12.png"
    alt="Sélection des champs pour la jointure"
    caption="Sélection des champs pour la jointure"
/>

Les données jointes sont ajoutées directement à la table attributaire du fond de carte (c'est-à-dire que celui-ci contient désormais de nouvelles colonnes : )

## 4. Représentation des données

### 4.1 Choix d'une projection cartographique

<ZoomImg
    src="/tuto2-13.gif"
    alt="Choix de la projection cartographique 'RGF93 v1 / Lambert-93'"
    caption="Choix de la projection cartographique 'RGF93 v1 / Lambert-93'"
/>


### 4.2 Choix d'une représentation

Nous allons maintenant choisir une représentation pour notre carte. Nous allons ici choisir une carte choroplèthe,
représentant le pourcentage d'abstention au second tour de l'élection législative de 2022.

Pour cela il est nécessaire de choisir la couche à représenter (ici, la couche des bureaux de vote actuels avec les données jointes),
et de cliquer sur le bouton permettant d'accéder à la fenêtre de choix de la représentation ou de fonctionnalités d'analyse :

<ZoomImg
    src="/tuto2-14.png"
    alt="Accéder à la fenêtre de choix de la représentation"
    caption="Accéder à la fenêtre de choix de la représentation"
/>

Cela permet d'ouvrir une fenêtre contenant une quinzaine de boites : celles qui sont grisées ne sont pas disponibles pour la couche sélectionnée (par exemple car la couche ne contient
pas les données permettant de mettre en œuvre la représentation en question).

Nous cliquons pour notre part sur la boite "Choroplèthe" pour ouvrir la fenêtre de paramétrage de la carte choroplèthe.


<ZoomImg
    src="/tuto2-15.png"
    alt="Choix d'une représentation choroplèthe"
    caption="Choix d'une représentation choroplèthe"
/>

Cette fenêtre permet de choisir :
- la variable à représenter (ici `pourcentage_d_abstentions`),
- la discrétisation (parmis plusieurs raccourcis, ou en ouvrant une fenêtre dédiée à la discrétisation - c'est ce que nous faisons ici).

<ZoomImg
    src="/tuto2-16.png"
    alt="Paramètres de création d'une carte choroplèthe"
    caption="Paramètres de création d'une carte choroplèthe"
/>

La fenêtre de discrétisation comporte plusieurs éléments permettant de mieux comprendre la distribution des valeurs de la variable à représenter :
- un résumé statistique des valeurs de la variable (minimum, maximum, moyenne, médiane, écart-type),
- un graphique présentant à la fois un histogramme des valeurs, une courbe de densité, une boite à moustache et la position réelle de chaque valeur.

Ces éléments permettent de choisir une méthode de discrétisation adaptée à la distribution des valeurs de la variable.

Dans sa moitié inférieure, cette fenêtre comprend les éléments permettant de paramétrer la discrétisation :
- choix de la méthode,
- choix du nombre de classes souhaitées,
- choix d'une palette de couleurs,
- etc. (d'autres options peuvent apparaitre en fonction du type de discrétisation demandée ou du type de palette demandée).

Un graphique présente également la répartition des valeurs dans les classes créées (ainsi que le nombre de valeurs dans chaque classe).

<ZoomImg
    src="/tuto2-17.png"
    alt="Paramètres de discrétisation"
    caption="Paramètres de discrétisation"
/>

Une fois satisfait avec la discrétisation choisie, il est possible de cliquer sur "Confirmation" pour valider les choix de discrétisation,
puis de cliquer sur "Confirmation" pour valider la création de la carte choroplèthe.

La carte est alors créée et affichée à l'écran.

<ZoomImg
    src="/tuto2-18.png"
    alt="Résultat après création de la carte choroplèthe"
    caption="Résultat après création de la carte choroplèthe"
/>

Différentes options de personnalisation du résultat sont disponibles, notamment afin de déplacer et de personnaliser la légende.
Un menu contextuel (accessible après un clic-droit sur la légende) permet notamment d'ouvrir la fenêtre de personnalisation de la légende.
Il est également possible d'accéder à cette fenêtre en faisant un double-clic sur la légende.

<ZoomImg
    src="/tuto2-19.gif"
    alt="Déplacement de la légende et ouverture du panneau de personnalisation de la légende"
    caption="Déplacement de la légende et ouverture du panneau de personnalisation de la légende"
/>

Nous choisissons ici de modifier de nombreux éléments de la légende : 
- titre de la légende,
- sous-titre de la légende,
- note en bas de la légende (pour enlever la note par défaut),
- taille des blocs de couleur,
- arrondi des coins des blocs de couleur (afin de créer des cercles),
- espacement entre les blocs de couleur (afin qu'ils ne soient plus collés les uns aux autres comme c'est le cas par défaut),
- taille des différents éléments textuels (titre, sous-titre et étiquettes des classes).

Ce sont ces choix qui permettent de créer une légende plus lisible et plus esthétique (au tout du moins, qui correspond plus à nos attentes) :

<ZoomImg
    src="/tuto2-lgd.png"
    alt="Exemples de légende personnalisée"
    caption="Exemples de légende personnalisée"
/>

Il est également possible de personnaliser différents paramètres de la carte choroplèthe qui vient d'être créée en cliquant sur 
le bouton "Paramètres" dans le gestionnaire de couche :

<ZoomImg
    src="/tuto2-20.png"
    alt="Accéder aux paramètres de la couche"
    caption="Accéder aux paramètres de la couche"
/>

Cette fenêtre permet ainsi de modifier des paramètres généraux (opacité de la couche, couleur, épaisseur et opacité de la bordure, ajout d'une ombre à la couche, etc.) mais
également de modifier l'ensemble des paramètres de discrétisation qui ont été choisis lors de la création de la carte choroplèthe (nombre de classes, méthode de discrétisation, palette de couleurs, etc.).

<ZoomImg
    src="/tuto2-21.png"
    alt="Paramètres de la couche"
    caption="Paramètres de la couche"
/>

Nous choisissons ici :
- de modifier la couleur de la bordure pour la rendre grise,
- d'ajouter une ombre à la couche afin de la détacher visuellement du fond de carte.


## 5. Habillage de la carte

Lorsque la carte est satisfaisante, il est possible de l'habiller pour la rendre plus lisible et plus esthétique.

Dans le menu latéral gauche, il est possible d'accéder à la section "Mise en page et éléments d'habillage". Celle-ci permet différentes actions :
- ajout d'un titre et d'une source à la carte (il s'agit simplement de zones de texte, déjà positionnées),
- choix de la couleur du fond de la carte,
- ajout de différents éléments traditionnels :
  - flèche ou ligne brisée,
  - rectangle ou cercle,
  - flèche du nord,
  - échelle graphique,
  - zone de texte,
  - image ou symbole au choix,
  - dessin libre (à main levée).

Dans notre cas nous choisissons d'ajouter un titre à la carte, en conservant son positionnement d'origine :

<ZoomImg
    src="/tuto2-22.png"
    alt="Mise en page et élément d'habillage - titre de la carte"
    caption="Mise en page et élément d'habillage - titre de la carte"
/>

Nous choisissons également d'ajouter une marge autour de la carte, pour permettre d'héberger le titre et la source des données, sans que ceux-ci n'interfèrent avec la carte elle-même.

Il est possible de choisir la dimension de chaque marge (haut, bas, droite, gauche) en pixels et de définir une couleur et une opacité pour la marge.

Dans notre cas, nous ajoutons seulement une marge en haut et en bas.

<ZoomImg
    src="/tuto2-23.png"
    alt="Ajout de marge autour de la carte"
    caption="Ajout de marge autour de la carte"
/>

Nous utilisons ensuite les fonctionnalités *"zone de texte"* et *"ligne brisée"* afin d'indiquer 3 lieux d'intérêt sur la carte : il s'agit des 3 bureaux de vote avec le plus
fort taux d'abstention au second tour de l'élection législative de 2022.

## 6. Export de la carte

Une fois le résultat satisfaisant, il est possible d'exporter la carte réalisée :
- en PNG (en choisissant la taille en pixel, par défaut il s'agit de celle actuelle de la carte),
- en SVG.

Puisque nous ne souhaitons pas retoucher la carte *a posteriori* dans un logiciel de dessin vectoriel, nous choisissons l'export en PNG.

<ZoomImg
    src="/tuto2-24.png"
    alt="Options d'export de la carte"
    caption="Options d'export de la carte"
/>

La carte ainsi exportée est fidèle à celle affichée à l'écran, et peut être utilisée dans un rapport, une présentation ou tout autre document :

<ZoomImg
    src="/tuto2-fin.png"
    alt="Carte finalisée, après export au format PNG"
    caption="Carte finalisée, après export au format PNG"
/>
