
//========================================
// geometry conversion
//========================================

var VECNIK = VECNIK || {};

(function(VECNIK) {

//  var latlng = new VECNIK.LatLng(0, 0);
//  VECNIK.projectGeometry = function(feature, tileX, tileY, zoom) {
//  VECNIK.Settings.WEBWORKERS

  VECNIK.GeoJsonReader = function(options) {
    VECNIK.Events.prototype.constructor.call(this);
    this._options = options || {};
    this._projection = options.projection;
  };

  var proto = VECNIK.GeoJsonReader.prototype = new VECNIK.Events();

  proto._toBuffer = function(coordinates, coords) {
    var
      len = coordinates.length,
      latlng = new VECNIK.LatLng(0, 0),
      point,
      buffer = new Int16Array(len*2);

    for (var i = 0; i < len; i++) {
      latlng.latitude  = coordinates[i][1];
      latlng.longitude = coordinates[i][0];
      point = this._projection.latLngToTilePoint(latlng, coords.x, coords.y, coords.z);
      buffer[i*2  ] = point.x;
      buffer[i*2+1] = point.y;
    }
    return buffer;
  };

  proto._addPoint = function(coordinates, properties, coords, dataByRef) {
    dataByRef.push({
      type: 'Point',
      coordinates: this._toBuffer([coordinates], coords),
      properties: properties
    });
  };

  proto._addLineString = function(coordinates, properties, coords, dataByRef) {
    dataByRef.push({
      type: 'LineString',
      coordinates: this._toBuffer(coordinates, coords),
      properties: properties
    });
  };

  proto._addPolygon = function(coordinates, properties, coords, dataByRef) {
    var rings = [];
    for (var i = 0, il = coordinates.length; i < il; i++) {
      rings.push(this._toBuffer(coordinates[i], coords));
    }
    dataByRef.push({
      type: 'Polygon',
      coordinates: rings,
      properties: properties
    });
  };

  proto._copy = function(obj) {
    var
      keys = Object.keys(obj),
      res = {};
    for (var i = 0, il = keys.length; i < il; i++) {
      res[keys[i]] = obj[keys[i]];
    }
    return res;
  };

  proto.convertAsync = function(collection, coords) {
    var
      m, ml,
      dataByRef = [],
      feature,
      type, coordinates, properties;

    for (var i = 0, il = collection.features.length; i < il; i++) {
      feature = collection.features[i];

      if (!feature.geometry) {
        continue;
      }

      type = feature.geometry.type;
      coordinates = feature.geometry.coordinates;
      properties = feature.properties;

      switch (type) {
        case 'Point':
          this._addPoint(coordinates, properties, coords, dataByRef);
        break;

        case 'MultiPoint':
          for (m = 0, ml = coordinates.length; m < ml; m++) {
            this._addPoint(coordinates[m], this._copy(properties), coords, dataByRef);
          }
        break;

        case 'LineString':
          this._addLineString(coordinates, properties, coords, dataByRef);
        break;

        case 'MultiLineString':
          for (m = 0, ml = coordinates.length; m < ml; m++) {
            this._addLineString(coordinates[m], this._copy(properties), coords, dataByRef);
          }
        break;

        case 'Polygon':
          this._addPolygon(coordinates, properties, coords, dataByRef);
        break;

        case 'MultiPolygon':
          for (m = 0, ml = coordinates.length; m < ml; m++) {
            this._addPolygon(coordinates[m], this._copy(properties), coords, dataByRef);
          }
        break;
      }
    }

    this.emit('success', dataByRef);
    return this;
  };

//  proto._project = function(data) {
//    var
//      collection = data.features,
//      feature, coordinates;
//
//    if (VECNIK.settings.get('WEBWORKERS') && typeof Worker !== undefined) {
//      var worker = new Worker('../src/projector.worker.js');
//
//      var self = this;
//      worker.onmessage = function(e) {
//        self._data = e.data;
//      };
//
//      worker.postMessage({ collection: collection, x: this._x, y: this._y, zoom: this._zoom });
//      return;
//    }
//
//    this._data = [];
//    for (var i = 0, il = collection.length; i < il; i++) {
//      feature = collection[i];
//      if (!feature.geometry) {
//        continue;
//      }
//
//      coordinates = VECNIK.projectGeometry(feature.geometry, this._x, this._y, this._zoom);
//      if (!coordinates || !coordinates.length) {
//        continue;
//      }
//
//      this._data.push({
//        coordinates: coordinates,
//        type: feature.geometry.type,
//        properties: feature.properties
//      });
//    }
//  };

})(VECNIK);
