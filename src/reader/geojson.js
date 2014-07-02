var Core = require('../core/core');
var Geometry = require('../geometry');
var Projection = require('../mercator');

function _addPoint(geoCoords, projection, groupId, properties, tileCoords, dataByRef) {
  dataByRef.push({
    groupId: groupId,
    type: Geometry.POINT,
    coordinates: _toBuffer([geoCoords], projection, tileCoords),
    properties: properties
  });
}

function _addLineString(geoCoords, projection, groupId, properties, tileCoords, dataByRef) {
  dataByRef.push({
    groupId: groupId,
    type: Geometry.LINE,
    coordinates: _toBuffer(geoCoords, projection, tileCoords),
    properties: properties
  });
}

function _addPolygon(geoCoords, projection, groupId, properties, tileCoords, dataByRef) {
  var rings = [];
  for (var i = 0, il = geoCoords.length; i < il; i++) {
    rings.push(_toBuffer(geoCoords[i], projection, tileCoords));
  }
  dataByRef.push({
    groupId: groupId,
    type: Geometry.POLYGON,
    coordinates: rings,
    properties: properties
  });
}

function _convertAndReproject(collection, projection, tileCoords) {
  var
    m, ml,
    dataByRef = [],
    feature,
    type, geoCoords, groupId, properties;

  for (var i = 0, il = collection.features.length; i < il; i++) {
    feature = collection.features[i];

    if (!feature.geometry) {
      continue;
    }

    type = feature.geometry.type;
    geoCoords = feature.geometry.coordinates;
    // TODO: cartodb_id is a custom enhancement, per definition it's feature.id
    // it's 'groupId' instead of just 'id' as it can occur multiple times for multi-geometriees or geometries cut by tile borders!
    groupId = feature.id || feature.properties.id || feature.cartodb_id || feature.properties.cartodb_id;
    properties = feature.properties;

    switch (type) {
      case Geometry.POINT:
        _addPoint(geoCoords, projection, groupId, properties, tileCoords, dataByRef);
      break;

      case 'Multi'+ Geometry.POINT:
        for (m = 0, ml = geoCoords.length; m < ml; m++) {
          _addPoint(geoCoords[m], projection, groupId, _copy(properties), tileCoords, dataByRef);
        }
      break;

      case Geometry.LINE:
        _addLineString(geoCoords, projection, groupId, properties, tileCoords, dataByRef);
      break;

      case 'Multi'+ Geometry.LINE:
        for (m = 0, ml = geoCoords.length; m < ml; m++) {
          _addLineString(geoCoords[m], projection, _copy(properties), tileCoords, dataByRef);
        }
      break;

      case Geometry.POLYGON:
        _addPolygon(geoCoords, projection, groupId, properties, tileCoords, dataByRef);
      break;

      case 'Multi'+ Geometry.POLYGON:
        for (m = 0, ml = geoCoords.length; m < ml; m++) {
          _addPolygon(geoCoords[m], projection, groupId, _copy(properties), tileCoords, dataByRef);
        }
      break;
    }
  }

  return dataByRef;
}

function _toBuffer(geoCoords, projection, tileCoords) {
  var
    len = geoCoords.length,
    point,
    buffer = new Int16Array(len*2);

  for (var i = 0; i < len; i++) {
    point = projection.latLonToTilePoint(geoCoords[i][1], geoCoords[i][0], tileCoords.x, tileCoords.y, tileCoords.z);
    buffer[i*2  ] = point.x;
    buffer[i*2+1] = point.y;
  }
  return buffer;
}

function _copy(obj) {
  var
    keys = Object.keys(obj),
    res = {};
  for (var i = 0, il = keys.length; i < il; i++) {
    res[keys[i]] = obj[keys[i]];
  }
  return res;
}

var Reader = module.exports = {};

Reader.load = function(url, tileCoords, projection, callback) {
//  if (!Reader.WEBWORKERS || typeof Worker === undefined) {
  if (typeof Worker === undefined) {
    Core.load(url, function(collection) {
      callback(_convertAndReproject(collection, projection, tileCoords));
    });
  } else {
    var worker = new Worker('../src/reader/geojson.worker.js');
    worker.onmessage = function(e) {
      callback(e.data);
    };

    worker.postMessage({ url:url, tileCoords:tileCoords });
  }
};

Reader.convertForWorker = function(collection, tileCoords) {
  // TODO: projection has to be passed from outside (but worker doesn't accept that)
  var projection = new Projection();
  return _convertAndReproject(collection, projection, tileCoords);
};
