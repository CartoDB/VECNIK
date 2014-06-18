
# CartoCSS in Vecnik

CartoCSS is a language built to style maps, similar to less, created by Mapbox to style the maps
created in Tilemill, see more info about this in their [cartocss repo](https://github.com/mapbox/carto)

CartoCSS support in Vecnik is focused on data visualization and it does not support all the features
Mapnik supports. This document explain briefly the diferences in CartoCSS rules and rendering
between Vecnik and Mapnik (*).


## Vecnik CartoCSS implementation

The implementation is not the same than the one used to create Mapnik XML, it compiles CartoCSS to
javascript shaders. The source code is located in [CartoDB repository on
github](https://github.com/cartodb/carto)


## vecnik CartoCSS reference

TODO: link here to cartocss reference


## differences with Mapnik support

- rendering things like polygon strokes










(*) Mapnik does not support CartoCSS directly but it does indirectly through XML.
