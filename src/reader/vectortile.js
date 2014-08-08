
var VECNIK = require('../core/core');
var Geometry = require('../geometry');

var PBF = require('pbf');
var VT = require('vector-tile').VectorTile;

function _addPoint(coordinates, id, properties, tile, dataByRef) {
  dataByRef.push({
    id: id,
    type: Geometry.POINT,
    coordinates: _toBuffer(coordinates[0], tile),
    properties: properties
  });
}

function _addLineString(coordinates, id, properties, tile, dataByRef) {
  dataByRef.push({
    id: id,
    type: Geometry.LINE,
    coordinates: _toBuffer(coordinates[0], tile),
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
  buffer = new PBF(new Uint8Array(buffer));

  var vTile = new VT(buffer);
  var f, numFeatures;
  var dataByRef = [], feature;

  for (var l in vTile.layers) {
    numFeatures = vTile.layers[l].length;
    for (f = 0; f < numFeatures; f++) {
      feature = vTile.layers[l].feature(f);
      _addGeometry(
        feature.type,
        feature.loadGeometry(),
        feature._id || feature.properties[VECNIK.ID_COLUMN],
        feature.properties,
        tile,
        dataByRef
      );
    }
  }

  return dataByRef;
}

function _addGeometry(geometryType, coordinates, id, properties, tile, dataByRef) {
  switch (geometryType) {
    case 1: // Point
      _addPoint(coordinates, id, properties, tile, dataByRef);
    break;

    case 2: // LineString
      _addLineString(coordinates, id, properties, tile, dataByRef);
    break;

    case 3: // Polygon
      _addPolygon(coordinates, id, properties, tile, dataByRef);
    break;
  }
}

function _toBuffer(coordinates, tile) {
  var
    len = coordinates.length,
    buffer = new Int16Array(len*2);

  for (var i = 0; i < len; i++) {
    buffer[i*2  ] = coordinates[i].x;// - tile.x;
    buffer[i*2+1] = coordinates[i].y;// - tile.y;
  }

  return buffer;
}

var VectorTile = module.exports = {};

VectorTile.load = function(url, tile, callback) {
//  if (!VectorTile.WEBWORKERS || typeof Worker === undefined) {
//  if (typeof Worker === undefined) {
    VECNIK.load(url, 'arraybuffer', function(buffer) {
      callback(_convertAndReproject(buffer, tile));
    });
//  } else {
//    var worker = new Worker('../src/reader/vectortile.worker.js');
//    worker.onmessage = function(e) {
//      callback(e.data);
//    };
//
//    worker.postMessage({ url: url, tile: tile });
//  }
};

VectorTile.convertForWorker = function(buffer, tile) {
  return _convertAndReproject(buffer, tile);
};
