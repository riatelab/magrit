# Point aggregation

This analysis method transforms and plots the information contained in a set of points onto a mesh selected by the user.

The user has two options for selecting the mesh to be used:

- use of a regular grid (choice of tile size and shape) created by the application
- use of a polygon layer (administrative background, for example) supplied by the user.

Several analysis options are available to calculate :

- point density per cell (using a grid) or per entity (using a user-supplied background)
- point density weighted by a numerical field for each cell/entity.
- the average of point values located in each cell/entity.
- the standard deviation of point values in each cell/entity.

## Examples

<ZoomImg
    src="/aggregation-pts-0.png"
    alt="Input dataset"
    caption="Input dataset"
/>

<ZoomImg
    src="/aggregation-pts-1.png"
    alt="Aggregation of points on a regular grid"
    caption="Aggregation of points on a regular grid"
/>

<ZoomImg
    src="/aggregation-pts-2.png"
    alt="Aggregation of points on an existing polygon layer"
    caption="Aggregation of points on an existing polygon layer"
/>
