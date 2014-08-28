
# Data handling in Vecnik

## Providers

Vecnik consumes vector data via providers.
There are predefined Providers for CartoDB SQL API and data tiles (TMS), but custom providers can be created.

Providers and readers create a common interface about how data is passed.


### CartoDB SQL API

It provides you a convenient solution to assemble a CartoDB conformant SQL query.

```javascript
/*
 * @reader {Reader} one of the supported plugins for data formats, see below
 * @options {object} a hash of settings for:
 *   user {string} CartoDB account
 *   table {string} table to access
 *   columns {array} extra columns to select, cartodb_id & the_geom are default, use '*' to fetch all
 *   filter {string} extra sql WHERE conditions
 *   bufferSize {number} tolerance for ENABLE_CLIPPING beyond tile borders (see below)
 *   ENABLE_SIMPLIFY {bool} simplifies geometries according to zoom level
 *   ENABLE_SNAPPING {bool} snaps coordinates to a grid of points - less unique values
 *   ENABLE_CLIPPING {bool} clips geometries by tile bounds (+ some tolerance beyond)
 *   ENABLE_FIXING {bool}
 */
new VECNIK.Layer({
  provider: new VECNIK.CartoDB.API(reader, options)
  //...
});
```


### TMS

Manages access to data tiles according to Z/X/Y url schema.

```javascript
/*
 * @template {string} url template, i.e. 'http://a.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6-dev/{z}/{x}/{y}.vector.pbf'
 * @reader {Reader} one of the supported plugins for data formats, see below
 */
new VECNIK.Layer({
  provider: new VECNIK.TMS(template, reader)
  //...
});
```


## Readers

While providers handle sending requests and transferring responses, readers are responsible for converting different data formats.

By default, we are supporting [GeoJSON](http://geojson.org) and [Mapnik Vector Tiles](https://github.com/mapbox/vector-tile-spec/tree/master/1.0.0).

Providers trigger Reader.load() with a map tile coordinate object.

```javascript
/*
 * @tile {object} tile coordinate object { x:x{float}, y:y{float}, z:zoom{int} }
 * @callback {function} callback for asynchronous results
 */
Reader.load(tile, callback{function});
```

Callback function expects an array of feature objects:

```javascript
[{
  id: geometryId, // {int} a unique identifier of that geometry
  type: geometryType, // {string} 'Point', 'LineString', 'Polygon' as defined in GeoJSON, 'Multi'-types have to be resolved to individual items
  coordinates: coordinates, // {Int16Array} geometry coordinates as array buffer
  properties: featureProperties // {object} additional feature properties
},
...
]
```

Coordinates will be be provided as pixel coordinates, relative to tile position.
Projection is EPSG:3587 (web mercator).


## Perspective

We are planning to make even more use of buffers by:
- using binary indentifiers instead of feature geometry types as string
- using {UintXArray} as index for coordinates
- using a {Uint32Array} as common coordinates buffer for all features, per tile
