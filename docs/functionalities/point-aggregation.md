# Agrégation d'un semis de points

Cette méthode d'analyse permet de transformer et de reporter les informations contenues dans un semis de points sur un maillage choisi par l'utilisateur.

Deux possibilités sont offertes à l'utilisateur concernant le choix du maillage à utiliser :

- utilisation d'une grille régulière (choix de la taille et de la forme des carreaux) créée par l'application
- utilisation d'une couche de polygones (fond administratif par exemple) fourni par l'utilisateur

Plusieurs options d'analyse sont proposées et visent à calculer :

- la densité de points par cellule (utilisation d'une grille) ou par entité (utilisation d'un fond utilisateur)
- la densité de points pondérée par un champ numérique pour chaque cellule/entité.
- la moyenne des valeurs des points situés dans chaque cellule/entité.
- l'écart-type des valeurs des points situés dans chaque cellule/entité.

### Exemples

<ZoomImg
    src="/aggregation-pts-0.png"
    alt="Jeu de données d'entrée (station de rechargement de véhicules électriques à Paris)"
    caption="Jeu de données d'entrée (station de rechargement de véhicules électriques à Paris)"
/>

<ZoomImg
    src="/aggregation-pts-1.png"
    alt="Agrégation des points sur une grille régulière (carte choroplèthe de la densité de points)"
    caption="Agrégation des points sur une grille régulière (carte choroplèthe de la densité de points)"
/>

<ZoomImg
    src="/aggregation-pts-2.png"
    alt="Agrégation des points dans une couche existante (carte choroplèthe de la densité de points par quartier de Paris)"
    caption="Agrégation des points dans une couche existante (carte choroplèthe de la densité de points par quartier de Paris)"
/>
