
# Data format in Vecnik

Vecnik consumes vector data via providers.

We are creating default providers for [GeoJSON](http://geojson.org) and [Mapnik Vector Tiles](https://github.com/mapbox/vector-tile-spec/tree/master/1.0.0).
Binary trasfer is possible option.

All providers share an interface about how data is passed to Vecnik.
It's recommended to implement this by using web workers.


### Example

```javascript
var provider = new Provider({ ... });
new VECNIK.Layer({
  provider: provider,
  ...
});
```

### Interface

Vecnik triggers Provider.load() with a map tile coordinate object:

```javascript
Provider.load({ x:tileX{float}, y:tileY{float}, z:zoom{int} });
```

Vecnik sets a custom Provider.onLoad() method in order to receive results.

```javascript
Provider.onLoad({array});
```

Expected data structure is an array of feature objects:

```javascript
{
  type: geometryType{string}, // 'Point', 'LineString', 'Polygon' as defined in GeoJSON, Multi-Elements have to be resolved to individual items
  coordinates: coordinates{Int16Array}, // geometry coordinates as array buffer
  properties: feature.properties // additional properties as data object
}
```

Coordinates have to be provided as pixel coordinates, relative to tile position.
Required projection is EPSG:3587 (web mercator).

### Perspective

We are planning to make even more use of buffers by:
- using binary indentifiers instead of feature geometry types as string
- using {UintXArray} as index for coordinates
- using a {Uint32Array} as common coordinates buffer for all features, per tile
