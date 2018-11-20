# FAQ


### Pourquoi un nombre trop important de couleurs dans une palette peut nuire à la lisibilité de la carte ?
L’œil humain ne distingue correctement qu'un nombre de couleurs limité. L'utilisation d'un nombre de couleurs élevé lors de la conception d'une palette pour une carte choroplèthe empêche de percevoir avec précision les limites entre les classes et rend ainsi difficile de trouver la classe d'appartenance d'une entité.


### Pourquoi une limite de taille est-elle fixée lors de l'import d'un fond de carte ?

La taille maximale des fichiers pouvant être importés dans Magrit est limitée à 20Mo. Plusieurs raisons ont motivé ce choix et visent essentiellement à éviter des ralentissements indésirables dans le navigateur de l'utilisateur.
 D'une part le temps d'envoi d'un fichier volumineux peut être importante en fonction de la qualité de la connexion (un fichier de 20Mo peut nécessiter plusieurs minutes). D'autre part Magrit utilise la technologie SVG pour effectuer le rendu des cartes dans le navigateur. Cette technologie est performante mais se prête difficilement à l'affichage des couches contenant un nombre très élevé d'entités.
Ce type de limite permet également de s'interroger sur l’intérêt d'une carte thématique contenant un nombre d'entités très élevé ou contenant des géométrie très détaillées. En effet, en fonction du type de données ou de l'échelle de travail, il peut être utile de faire appel au préalable à certaines techniques de préparation des données (agrégation dans le cas d'un semis de points très important par exemple) ou de préparation du fond de carte (généralisation des géométries utilisées par exemple).


### Pourquoi le rendu de certains exports SVG n'est pas le même dans Inkscape/Adobe Illustrator que lors de l'affichage de la carte dans Magrit ?
Lors de l'ouverture des exports SVG contenant des polices de caractères autres que celle définie par défaut, il est possible que certains logiciels ne les affichent pas correctement. Actuellement ces polices sont stockées dans le fichier SVG exporté par Magrit, ce qui n'est pas supporté par Inkscape par exemple (ce dernier nécessite que la police soit installée sur le système afin qu'elle soit reconnue). Nous travaillons actuellement à proposer un export séparée pour les polices de caractère lorsque nécessaire. De plus il est possible de vérifier le rendu SVG exporté par Magrit en ouvrant le fichier SVG avec un navigateur web (en le faisant glisser dans Firefox ou Chromium par exemple), afin de s'assurer que le rendu est conforme à ce qui était attendu.


### Pourquoi certains fond de cartes posent un problème lors de certains traitement ? Qu'est-ce que la "topologie" d'un fond de carte ?



### Pourquoi Magrit émet un message d'avertissement lorsque la géométrie de certaines entités d'une couche est nulle ?



### Pourquoi n'est-il pas possible d'afficher un fond type "OpenStreetMap" lors de la réalisation d'une carte avec Magrit ?
