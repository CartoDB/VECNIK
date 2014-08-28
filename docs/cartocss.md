
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


## CartoShader Interface

CartoShader like any other shader should stick to follwing interface.
It's basically a defined set of style properties, thats close to Canvas and close to CartoCSS but generic.

| CartoCSS property | Shader interface | (Canvas equivalent) |
| --- | --- | --- |
| **POINT RELATED** |||
| marker-width | markerSize | arc({radius}) |
| marker-color | markerFill | fillStyle |
| marker-opacity | markerOpacity | globalOpacity |
| marker-comp-op | markerCompOp | globalCompositingOperation |
| marker-fill | markerFill | fillStyle |
| marker-line-color | lineColor | strokeStyle |
| marker-line-width | markerLineWidth | lineWidth |
| marker-allow-overlap | markerAllowOverlap | N/A |
| marker-file | markerFile | drawImage({img.src}) |
| **LINE REALATED** |||
| line-color | lineColor | strokeStyle |
| line-width | lineWidth | lineWidth |
| line-opacity | lineOpacity | globalOpacity |
| line-comp-op | lineCompOp | globalCompositingOperation |
| **POLYGON RELATED** |||
| polygon-fill | polygonFill | fillStyle |
| polygon-opacity | polygonOpacity | globalOpacity |
| polygon-comp-op | polygonCompOp | globalCompositingOperation |
| polygon-pattern-file | polygonPatternFile | fillStyle |
| polygon-pattern-comp-op | polygonCompOp | globalCompositingOperation |
| **TEXT RELATED** |||
| text-face-name | fontFace | font |
| text-size | fontSize | font |
| text-fill | textFill | fillStyle |
| text-opacity | textOpacity | globalOpacity |
| text-comp-op | textCompOp | globalCompositingOperation |
| text-halo-fill | textOutlineColor | strokeStyle |
| text-halo-radius | textOutlineWidth | lineWidth |
| text-align | textAlign | textAlign |
| text-name | textContent | strokeText({string}) |
| text-allow-overlap | textAllowOverlap | N/A |


## Hit detection

Following properties are used for hit detection:

- markerFill, markerLineColor
- lineColor
- polygonFill
- textFill, textOutlineColor

This properties are explicity dropped im order not to breack colored hit areas:

- markerFile (gets replaced by a circle of same width)
- polygonPatternFile (gets replaced by a solid polygonFill)


## Rendering conditions

What style properties are required in order to droaw what kind of geometry?

- POINT: markerSize, markerFill or marker File
- LINE: lineColor
- POLYGON: lineColor or polygonFill, geometry of type POLYGON
- TEXT: textContent

(*) Mapnik does not support CartoCSS directly but it does indirectly through XML.
