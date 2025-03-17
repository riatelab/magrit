# Application settings

Magrit offers several general settings that allow you to customize the application according to your needs.

## Theme

It is possible to choose between two themes for the application interface: the light theme and the dark theme.
This option is available in the application menu bar, at the top right of the screen.

## Language

It is possible to choose between several languages for the application interface.

Currently only French, English and Spanish are available, but other languages may be added in the future.

This option is available in the application menu bar, at the top right of the screen.

## Other settings

Other settings are accessible by clicking on the (?) button in the application menu bar, at the top right of the screen
and then by clicking on "General options".

These options are stored in project files that can be exported from the application.

The options offered are as follows:

### Default language for number formatting

It is possible to choose the default language for number formatting in the application.

This enables to choose if a number (such as 12345.67) should be formatted as:

- `en-US` : 12,345.67
- `fr-FR` : 12 345,67
- `de-DE` : 12.345,67
- `es-ES` : 12.345,67
- `ar-EG` : ١٢٬٣٤٥٫٦٧
- etc.

### Direction of intervals closure for representations using classification

It is possible to select the direction of intervals closure for representations using classification (choropleth maps, discontinuity representation, etc.).

This option is new in version 2.3.0 and allows you to choose whether classes are closed :

- on the left (thus for class boundaries `1 - 3 - 5 - 8 - 10`, the intervals are `[1, 3[`, `[3, 5[`, `[5, 8[`, `[8, 10]`)

- on the right (thus for class boundaries `1 - 3 - 5 - 8 - 10`, the intervals are `[1, 3]`, `]3, 5]`, `]5, 8]`, `[8, 10]`)

This choice applies to all maps created in the application.

### Alignment grid color

It is possible to choose the color of the alignment grid to help position elements on the map.

This grid can be displayed in the [“Layout features”](./layout-features) section of the application's left-hand side menu.

### Default options for legends and graphs

Default settings can be selected for text elements, captions and graphics.

For each type of element (title, subtitle, notes, labels), the user can choose font, size, style, color and alignment.

### Default color for no-data values

It is possible to choose the default color for entities without data (this is used in choropleth and categorical choropleth maps).

### Activating the “Undo / Redo” function

It is possible to activate or deactivate the “Undo / Redo” functionality within the application.

This is represented by two buttons in the application's menu bar, in the top right-hand corner of the screen.

This allows you to undo or redo the last actions performed in the application.

This option is disabled by default, as it is particularly resource-hungry and can slow down the application in some cases. We
recommend activating it only if you have a powerful hardware configuration and/or when working with relatively light datasets.
