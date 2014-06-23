
var VECNIK = VECNIK || {};

(function(VECNIK) {

  function _addPoint(geoCoords, projection, properties, tileCoords, dataByRef) {
    dataByRef.push({
      type: 'Point',
      coordinates: _toBuffer([geoCoords], projection, tileCoords),
      properties: properties
    });
  }

  function _addLineString(geoCoords, projection, properties, tileCoords, dataByRef) {
    dataByRef.push({
      type: 'LineString',
      coordinates: _toBuffer(geoCoords, projection, tileCoords),
      properties: properties
    });
  }

  function _addPolygon(geoCoords, projection, properties, tileCoords, dataByRef) {
    var rings = [];
    for (var i = 0, il = geoCoords.length; i < il; i++) {
      rings.push(_toBuffer(geoCoords[i], projection, tileCoords));
    }
    dataByRef.push({
      type: 'Polygon',
      coordinates: rings,
      properties: properties
    });
  }

  function _convertAndReproject(collection, projection, tileCoords) {
    var
      m, ml,
      dataByRef = [],
      feature,
      type, geoCoords, properties;

    for (var i = 0, il = collection.features.length; i < il; i++) {
      feature = collection.features[i];

      if (!feature.geometry) {
        continue;
      }

      type = feature.geometry.type;
      geoCoords = feature.geometry.coordinates;
      properties = feature.properties;

      switch (type) {
        case 'Point':
          _addPoint(geoCoords, projection, properties, tileCoords, dataByRef);
        break;

        case 'MultiPoint':
          for (m = 0, ml = geoCoords.length; m < ml; m++) {
            _addPoint(geoCoords[m], projection, _copy(properties), tileCoords, dataByRef);
          }
        break;

        case 'LineString':
          _addLineString(geoCoords, projection, properties, tileCoords, dataByRef);
        break;

        case 'MultiLineString':
          for (m = 0, ml = geoCoords.length; m < ml; m++) {
            _addLineString(geoCoords[m], projection, _copy(properties), tileCoords, dataByRef);
          }
        break;

        case 'Polygon':
          _addPolygon(geoCoords, projection, properties, tileCoords, dataByRef);
        break;

        case 'MultiPolygon':
          for (m = 0, ml = geoCoords.length; m < ml; m++) {
            _addPolygon(geoCoords[m], projection, _copy(properties), tileCoords, dataByRef);
          }
        break;
      }
    }

    return dataByRef;
  }

  function _toBuffer(geoCoords, projection, tileCoords) {
    var
      len = geoCoords.length,
      latlng = new VECNIK.LatLng(0, 0),
      point,
      buffer = new Int16Array(len*2);

    for (var i = 0; i < len; i++) {
      latlng.latitude  = geoCoords[i][1];
      latlng.longitude = geoCoords[i][0];
      point = projection.latLngToTilePoint(latlng, tileCoords.x, tileCoords.y, tileCoords.z);
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

  VECNIK.GeoJSON = {};

  VECNIK.GeoJSON.convertAsync = function(collection, projection, tileCoords, callback) {
//  if (!VECNIK.GeoJSON.WEBWORKERS || typeof Worker === undefined) {
    if (typeof Worker === undefined) {
      callback(_convertAndReproject(collection, projection, tileCoords));
    } else {
      var worker = new Worker('../src/projector.worker.js');
      worker.onmessage = function(e) {
        callback(e.data);
      };

      worker.postMessage({ collection:collection, projection:projection, tileCoords:tileCoords });
    }
  };

  VECNIK.GeoJSON.convertForWorker = function(collection, tileCoords) {
    // TODO: projection has to be passed from outside (but worker doesn't accept that)
    var projection = new VECNIK.MercatorProjection();
    return _convertAndReproject(collection, projection, tileCoords);
  };

})(VECNIK);
