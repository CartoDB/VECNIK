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


### Credits 

- [Modestmaps](http://modestmaps.com/)
- [Carto parser from developmentseed](https://github.com/mapbox/carto/tree/browser) 



