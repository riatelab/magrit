# Layer manager

The layer manager is a central element of the Magrit interface. It allows the user to manage the settings of the
various layers and tables imported into the application.

<ZoomImg
    src="/layer-manager.png"
    alt="Layer manager"
    caption="Layer manager"
/>

When both a geographical layer and a data table are present into the application,
they are separated by an horizontal line in the layer manager.

## Geographical layers


Several functions are available for each geographic data layer:

- display a summary of layer information on hover (1),
- display/hide layer legend (2),
- invert layer visibility (visible/invisible) (3),
- zoom on layer (4),
- display the [data table](./data-table) associated with the layer (5),
- modify the layer's [field typing](./typing) (6),
- delete the layer (7),
- modify [layer properties](./layer-properties) (8),
- create a new representation](./layer-creation) from the layer (9).

<ZoomImg
    src="/layer-manager-item.png"
    alt="Available functionalities for each layer"
    caption="Available functionalities for each layer"
/>

In addition, as in GIS or vector graphics software, the layer order in the Layer Manager
reflects the order in which the layers are displayed on the map
(the layer at the top of the list is displayed above the other layers, etc.).


## Data tables

For each data table, you can :

- display summary information about the table,
- join the data to a geographic layer](./functionalities/join),
- display the [data table](./data-table),
- modify the layer's [field typing](./typing),
- delete the data table.

In Magrit, tabular data has two main uses:

- to be attached to a geographic layer to create thematic maps,
- be used to create link maps (or flow maps).


