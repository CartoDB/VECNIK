
//========================================
// CartoDB data provider
//========================================

var VECNIK = VECNIK || {};

(function(VECNIK) {

  VECNIK.CartoDB = VECNIK.CartoDB || {};

  VECNIK.CartoDB.API = function(options) {
    this.projection = new VECNIK.MercatorProjection();
    this.options = options;
    this.base_url = 'http://'+ options.user +'.cartodb.com/api/v2/sql';

    if (this.options.ENABLE_SIMPLIFY === undefined) {
      this.options.ENABLE_SIMPLIFY = true;
    }
    if (this.options.ENABLE_SNAPPING === undefined) {
      this.options.ENABLE_SNAPPING = true;
    }
    if (this.options.ENABLE_CLIPPING === undefined) {
      this.options.ENABLE_CLIPPING = true;
    }
    if (this.options.ENABLE_FIXING === undefined) {
      this.options.ENABLE_FIXING = true;
    }
  };

  var proto = VECNIK.CartoDB.API.prototype = new VECNIK.Events();

  proto._debug = function(msg) {
    if (this.options.debug) {
      console.log(msg);
    }
  };

  proto.getUrl = function(x, y, zoom) {
    var sql = VECNIK.CartoDB.SQL(this.projection, this.options.table, x, y, zoom, this.options);
    this._debug(sql);
    return this.base_url +'?q='+ encodeURIComponent(sql) +'&format=geojson&dp=6';
  };

  proto.load = function(coords) {
    VECNIK.load(this.getUrl(coords.x, coords.y, coords.z))
      .on('load', this._convertAsync, this);
  };

// ******************************************************************
// TODO: conversion from GeoJSON can and should be made flexible in order to support different formats
// just developing an initial version inside here
// ******************************************************************

  proto._toBuffer = function(coordinates) {
    var
      len = coordinates.length,
      buffer = new Float32Buffer(len*2);
//    mercator.latLngToTilePoint(latlng, tileX, tileY, zoom);
    for (var i = 0; i < len; i++) {
      buffer[i*2  ] = coordinates[i][0];
      buffer[i*2+1] = coordinates[i][1];
    }
    return buffer;
  };

  proto._addPoint = function(coordinates, properties, dataByRef) {
    dataByRef.push({
      type: 'Point',
      coordinates: this._toBuffer(coordinates),
      properties: properties
    });
  };

  proto._addLineString = function(coordinates, properties, dataByRef) {
    dataByRef.push({
      type: 'LineString',
      coordinates: this._toBuffer(coordinates),
      properties: properties
    });
  };

  proto._addPolygon = function(coordinates, properties, dataByRef) {
    var innerRings = [];
    for (var i = 1, il = coordinates.length; i < il; i++) {
      innerRings.push(this._toBuffer(coordinates[i]));
    }
    dataByRef.push({
      type: 'Polygon',
      coordinates: this._toBuffer(coordinates[0]),
      innerRings: innerRings,
      properties: properties
    });
  };


//  var mercator = new VECNIK.MercatorProjection();
//
//  var primitiveProjectors = {
//    Point: function(coordinates, tileX, tileY, zoom) {
//      latlng.latitude  = coordinates[1];
//      latlng.longitude = coordinates[0];
//      return mercator.latLngToTilePoint(latlng, tileX, tileY, zoom);
//    },
//
//    LineString: function(coordinates, tileX, tileY, zoom) {
//      return primitiveProjectors.MultiPoint(coordinates, tileX, tileY, zoom);
//    },
//
//    Polygon: function(coordinates, tileX, tileY, zoom) {
//      var converted = [];
//      var projector = primitiveProjectors.LineString;
//      for (var i = 0, il = coordinates.length; i < il; i++) {
//        converted.push(projector(coordinates[i], tileX, tileY, zoom));
//      }
//      return converted;
//    }
//  };
//
//  VECNIK.projectGeometry = function(feature, tileX, tileY, zoom) {
//    var projector = primitiveProjectors[feature.type];
//    if (projector) {
//      return projector(feature.coordinates, tileX, tileY, zoom);
//    }
//  };




  proto._copy = function(obj) {
    var
      keys = Object.keys(obj),
      res = {};
    for (var i = 0, il = keys.length; i < il; i++) {
      res[keys[i]] = obj[keys[i]];
    }
    return res;
  };

  proto._convertAsync = function(collection) {
    var
      m, ml,
      dataByRef = [],
      feature,
      type, coordinates, properties;

    for (var i = 0, il = collection.length; i < il; i++) {
      feature = collection[i];

      if (!feature.geometry) {
        continue;
      }

      type = feature.geometry.type;
      coordinates = feature.geometry.coordinates;
      properties = feature.properties;

      switch (type) {
        case 'Point':
          this._addPoint(coordinates, properties, dataByRef);
        break;

        case 'MultiPoint':
          for (m = 0, ml = coordinates.length; m < ml; m++) {
            this._addPoint(coordinates[m], this._copy(properties), dataByRef);
          }
        break;

        case 'LineString':
          this._addLineString(coordinates, properties, dataByRef);
        break;

        case 'MultiLineString':
          for (m = 0, ml = coordinates.length; m < ml; m++) {
            this._addLineString(coordinates[m], this._copy(properties), dataByRef);
          }
        break;

        case 'Polygon':
          this._addPolygon(coordinates, properties, dataByRef);
        break;

        case 'MultiPolygon':
          for (m = 0, ml = coordinates.length; m < ml; m++) {
            this._addPolygon(coordinates[m], this._copy(properties), dataByRef);
          }
        break;
      }
    }

    this.emit('success', dataByRef);
    return dataByRef;
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
//        self.render();
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
//    this.render();
//  };

})(VECNIK);
