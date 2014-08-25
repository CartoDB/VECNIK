
var VECNIK   = require('../core/core');
var Geometry = require('../geometry');
var Profiler = require('../profiler');
var Mercator = require('../mercator');

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

function _convertAndReproject(collection, tile) {
  var profiler = VECNIK.Profiler.metric('conversion.geojson').start();

  var dataByRef = [], feature;

  for (var i = 0, il = collection.features.length; i < il; i++) {
    feature = collection.features[i];

    if (!feature.geometry) {
      continue;
    }

    _addGeometry(
      feature.geometry,
      feature.id || feature.properties.id || feature.properties.cartodb_id,
      feature.properties,
      tile,
      dataByRef
    );
  }

  profiler.end();
  return dataByRef;
}

function _addGeometry(geometry, id, properties, tile, dataByRef) {
  var i, il, coordinates = geometry.coordinates;

  switch (geometry.type) {
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
        _addLineString(coordinates[i], id, _clone(properties), tile, dataByRef);
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
          geometries[i],
          id,
          _clone(properties),
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

var GeoJSON = module.exports = {};

GeoJSON.load = function(url, tile, callback) {
  if (typeof Worker === undefined) {
    VECNIK.loadJSON(url, function(collection) {
      var metric = VECNIK.Profiler.metric('conversion.geojson').start();
      var data = _convertAndReproject(collection, tile);
      metric.end();
      callback(data);
    });
  } else {
    var worker = new Worker('../src/reader/geojson.worker.js');
    worker.onmessage = function(e) {
      callback(e.data);
    };

    worker.postMessage({ url: url, tile: tile });
  }
};

GeoJSON.convertForWorker = function(collection, tile) {
  var metric = VECNIK.Profiler.metric('conversion.geojson').start();
  var data = _convertAndReproject(collection, tile);
  metric.end();
console.log(metric.name);
  return data;
};
