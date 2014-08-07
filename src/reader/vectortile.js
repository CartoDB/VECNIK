
var VECNIK = require('../core/core');
var Geometry = require('../geometry');
var Mercator = require('../mercator');
//var VectorTile = require('vector-tile'); // Mapbox vector tile lib

var projection = new Mercator();

function _addPoint(coordinates, id, properties, tile, dataByRef) {
  dataByRef.push({
    id: id,
    type: Geometry.POINT,
    coordinates: _toBuffer([coordinates], tile),
    properties: properties
  });
}

function _addLineString(coordinates, id, properties, tile, dataByRef) {
  dataByRef.push({
    id: id,
    type: Geometry.LINE,
    coordinates: _toBuffer(coordinates, tile),
    properties: properties
  });
}

function _addPolygon(coordinates, id, properties, tile, dataByRef) {
  var rings = [];
  for (var i = 0, il = coordinates.length; i < il; i++) {
    rings.push(_toBuffer(coordinates[i], tile));
  }
  dataByRef.push({
    id: id,
    type: Geometry.POLYGON,
    coordinates: rings,
    properties: properties
  });
}

function _convertAndReproject(buffer, tile) {
  var dataByRef = [], feature;

  for (var i = 0, il = buffer.features.length; i < il; i++) {
    feature = buffer.features[i];

    if (!feature.geometry) {
      continue;
    }

    _addGeometry(
      // TODO: per GeoJSON definition it should be feature.id
      feature.id || feature.properties.id || feature.properties[VECNIK.ID_COLUMN],
      feature.properties,
      feature.geometry,
      tile,
      dataByRef
    );
  }

  return dataByRef;
}

function _addGeometry(id, properties, geometry, tile, dataByRef) {
  var
    i, il,
    type = geometry.type,
    coordinates = geometry.coordinates;

  switch (type) {
    case 'Point':
      _addPoint(coordinates, id, properties, tile, dataByRef);
    break;

    case 'MultiPoint':
      for (i = 0, il = coordinates.length; i < il; i++) {
        _addPoint(coordinates[i], id, _clone(properties), tile, dataByRef);
      }
    break;

    case 'LineString':
      _addLineString(coordinates, id, properties, tile, dataByRef);
    break;

    case 'MultiLineString':
      for (i = 0, il = coordinates.length; i < il; i++) {
        _addLineString(coordinates[i], _clone(properties), tile, dataByRef);
      }
    break;

    case 'Polygon':
      _addPolygon(coordinates, id, properties, tile, dataByRef);
    break;

    case 'MultiPolygon':
      for (i = 0, il = coordinates.length; i < il; i++) {
        _addPolygon(coordinates[i], id, _clone(properties), tile, dataByRef);
      }
    break;

    case 'GeometryCollection':
      var geometries = geometry.geometries;
      for (i = 0, il = geometries.length; i < il; i++) {
        _addGeometry(
          id,
          _clone(properties),
          geometries[i],
          tile,
          dataByRef
        );
      }
    break;
  }
}

function _toBuffer(coordinates, tile) {
  var
    len = coordinates.length,
    point,
    buffer = new Int16Array(len*2);

  for (var i = 0; i < len; i++) {
    point = projection.latLonToTilePoint(coordinates[i][1], coordinates[i][0], tile.x, tile.y, tile.z);
    buffer[i*2  ] = point.x;
    buffer[i*2+1] = point.y;
  }
  return buffer;
}

function _clone(obj) {
  var
    keys = Object.keys(obj),
    res = {};
  for (var i = 0, il = keys.length; i < il; i++) {
    res[keys[i]] = obj[keys[i]];
  }
  return res;
}

var VectorTile = module.exports = {};

VectorTile.load = function(url, tile, callback) {
//  if (!VectorTile.WEBWORKERS || typeof Worker === undefined) {
  if (typeof Worker === undefined) {
    VECNIK.loadBinary(url, function(buffer) {
      callback(_convertAndReproject(buffer, tile));
    });
  } else {
    var worker = new Worker('../src/reader/geojson.worker.js');
    worker.onmessage = function(e) {
      callback(e.data);
    };

    worker.postMessage({ url: url, tile: tile });
  }
};

VectorTile.convertForWorker = function(buffer, tile) {
  return _convertAndReproject(buffer, tile);
};

//  this._responseType = "arraybuffer"; // binary data

//  tile.data = new this.VectorTile(new Uint8Array(tile.xhr.response));
//  tile.layers = tile.data.toGeoJSON();

//  for (var t in tile.layers) {
//    var num_features = tile.layers[t].features.length;
//    for (var f=0; f < num_features; f++) {
//      var feature = tile.layers[t].features[f];
//
//      feature.properties.id = feature.properties.osm_id;
//      feature.geometry.coordinates = Geo.transformGeometry(feature.geometry, function (coordinates) {
//        coordinates[1] = -coordinates[1];
//        return coordinates;
//      });
//    };
//  }
