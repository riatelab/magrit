# Simplification

In cartography, generalization is an important step in the preparation of geographic data.
It is the *"principle of simplifying and adapting the delineation of a cartographic contour to the scale at which the map is rendered, with a dual imperative of precision and clarity "* ([Géoconfluences Glossary](https://geoconfluences.ens-lyon.fr/glossaire/generalisation-carto)).

In Magrit, only the simplification step (linear or surface entities) is available.

This reduces the number of points that make up the plot of a geographical entity. The advantage is twofold:

- reduce data size, sometimes significantly and without any noticeable difference at the scale at which the map is displayed, thus improving the application's display and calculation performance,
- improve map legibility by removing unnecessary details.

In Magrit, this simplification operation is carried out on the topological version of the geographical entities.
(this has the effect of preserving the topology of geographic entities, i.e. the adjacency relationships between them).

## Parameters

You can adjust the precision of point coordinates by defining a value (here using a power of 10)
which corresponds to the desired precision.

The coordinates are rounded off to this value, which has the effect of helping to hook the points of neighboring entities together when the topology of the input dataset is not perfect.

Line simplification is achieved using the Visvalingam-Whyatt algorithm.

This algorithm is based on deleting the least important points of a geographical
feature according to their relative importance.The choice of the right value for simplifying
the lines depends on the desired accuracy of the final map and is done by trial and error: the result must satisfy you visually, without generating topological problems
(creation of self-intersections, etc.) and without causing geographical entities to disappear.

## Example

In the following example, the line simplification operation enables us to move from a dataset containing a total of 227,950 points to one containing 27,071 points, with no visible difference in the scale used for thematic mapping, thus improving the application's display and calculation performance:

<ZoomImg
    src="/simplification-senegal-departements.png"
    alt="Simplification of a dataset (Senegal departments)"
    caption="Simplification of a dataset (Senegal departments)"
/>
