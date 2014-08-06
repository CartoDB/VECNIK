
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


## CartoShader Interface

CartoShader like any other shader should stick to follwing interface.
It's basically a defined set of style properties, thats close to Canvas and close to CartoCSS but generic.


| CartoCSS property | Shader interface | (Canvas equivalent) |
| --- | --- | --- |
| *POINT RELATED* | | |
| marker-width | markerSize | {radius} for arc() |
| marker-fill | markerFill | fillStyle |
| marker-line-color | lineColor | strokeStyle |
| marker-line-width | markerLineWidth | lineWidth |
| marker-color | markerFill | fillStyle |
| point-color | markerFill | fillStyle |
| marker-opacity (?) | markerAlpha | {none yet} |
| *LINE REALATED* | | |
| line-color | lineColor | strokeStyle |
| line-width | lineWidth | lineWidth |
| line-opacity | lineAlpha | {none yet} |
| *POLYGON RELATED* | | |
| polygon-fill | polygonFill | fillStyle |
| polygon-opacity | polygonAlpha | {none yet} |
| *TEXT RELATED* | | |
| text-face-name | fontFace | font |
| text-size | fontSize | font |
| text-fill | textFill | fillStyle |
| text-opacity | textAlpha | {none yet} |
| text-halo-fill | textOutlineColor | strokeStyle |
| text-halo-radius | textOutlineWidth | lineWidth |
| text-align | textAlign | textAlign |
| text-name | textContent | {text} for strokeText() |


## Rendering conditions

What style properties are required in order to droaw what kind of geometry?

- POINT: markerSize, markerFill
- LINE: lineColor
- POLYGON: lineColor or polygonFill, geometry of type POLYGON
- TEXT: textContent

(*) Mapnik does not support CartoCSS directly but it does indirectly through XML.
