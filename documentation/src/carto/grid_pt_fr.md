# Analyse d'un semis de points à travers un maillage

Cette méthode d'analyse permet de transformer et de reporter les informations contenues dans un semis de points sur un maillage choisi par l'utilisateur.

Deux possibilités sont offertes à l'utilisateur concernant le choix du maillage à utiliser :
- utilisation d'une grille régulière (choix de la taille et de la forme des carreaux) créée par l'application
- utilisation d'une couche de polygones (fond administratif par exemple) fourni par l'utilisateur

Plusieurs options d'analyse sont proposées et visent à calculer :
- la densité de points par cellule (utilisation d'une grille) ou par entité (utilisation d'un fond utilisateur)
- la densité de points pondérée par un champ numérique pour chaque cellule/entité.
- la moyenne des valeurs des points situés dans chaque cellule/entité.
- l'écart-type des valeurs des points situés dans chaque cellule/entité.

> ### Paramètres
> * Type de maillage à utiliser (grille régulière *(option 1)* ou couche de polygones *(option 2)*)
> * Type d'analyse (densité, densité pondérée, moyenne, écart-type)
> * Champ numérique à utiliser (*pour densité pondérée, moyenne, écart-type seulement*)
> * Couche de maillage à utiliser (*option 2*)
> * Taille des carreaux de la grille (*option 1*)
> * Forme des carreaux de la grille (*option 1*)
> * Couche de masquage/découpe à utiliser (*option 1*)
> * Palette de couleurs à utiliser

#### Exemples :

<p style="text-align: center;">
<img src="img/date_moyenne_bati.png" alt="gridded_map" style="width: 560px;"/>
</p>

- Type de maillage : **Couche de polygones**
- Type d'analyse : **Valeur moyenne**
- Champ numérique : **AN_CONST**
- Couche de maillage à utiliser : **Quartiers de Paris**
- Palette de couleur : **Oranges**


<p style="text-align: center;">
<img src="img/densite_fontaine.png" alt="gridded_map" style="width: 560px;"/>
</p>

- Type de maillage : **Couche de polygones**
- Type d'analyse : **Densité**
- Couche de masquage/découpe : **Quartiers de Paris**
- Carreaux en forme d'**hexagone**
- Taille de référence : **1.2km**
- Palette de couleur : **Blues**
