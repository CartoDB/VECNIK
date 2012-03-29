![Venik with OSM London](https://github.com/Vizzuality/VECNIK/raw/master/img/veknik_osm_london.png)

VECNIK
======
Veknik is a JS library that render features from [CartoDB](http://cartodb.com/) using HTML5 on top of [Modestmaps](http://modestmaps.com/). It includes an implementation of the [Carto](https://github.com/mapbox/carto) language for dynamically styling features using its CSS language.

This is a prototype implementation to showcase the use of Carto for rendering maps on the client, not on the server. The library retrieves  vector data from CartoDB using the [SQL API](http://developers.cartodb.com/api/sql.html) on geojson format.

**Warning: This is all experimental!**

### Examples

Check out this online examples for OpenStreetMap data:

[London roads from OpenStreetmap](http://vizzuality.github.com/VECNIK/examples/test_carto.html#14/51.4942/-0.1671)

[Police stops in NY](http://vizzuality.github.com/VECNIK/examples/test_carto.html#14/51.4942/-0.1671)


### How to run it

Download the project. It is all JS for the client, but you will need to run it from an http server, file:// would fail. It can make use of Webworkers to speed up rendering and parsing, but it is now disabled because of problems on Google Chrome.


### What is this interesting for?

Having the browser render the style of the geospatial data allows for a new world of possibilities in terms of interactivity and display. Think for example you can animate render based on attributes without having to reload new tiles. At the same time the geometries are on the browser which enables things like hover over features, highlights, modifications. More examples will come to demonstrate the power of using Carto on the client.


### Credits 

This project is only possible because of lot of other people releasing their source code as Open Source, particularly the Mapbox team who did a great work on Carto.

- [Modestmaps](http://modestmaps.com/)
- [Carto parser from developmentseed](https://github.com/mapbox/carto/tree/browser) 



