!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.VECNIK=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){

var Core = module.exports = {};

// TODO: http get - should be improved
Core.load = function(url, callback) {
  var req = new XMLHttpRequest();
  req.onreadystatechange = function() {
    if (req.readyState === 4) {
      if (req.status === 200) {
        callback(JSON.parse(req.responseText));
      }
    }
  };

  req.open('GET', url, true);
  req.send(null);
  return req;
};

},{}],2:[function(_dereq_,module,exports){

var Events = module.exports = function() {
  this._listeners = {};
};

var proto = Events.prototype;

proto.on = function(type, listener, scope) {
  var listeners = this._listeners[type] || (this._listeners[type] = []);
  listeners.push(function(payload) {
    listener.call(scope, payload);
  });
  return this;
};

proto.emit = function(type, payload) {
  if (!this._listeners[type]) {
    return;
  }
  var listeners = this._listeners[type];
  for (var i = 0, il = listeners.length; i < il; i++) {
    listeners[i](payload);
  }
};

},{}],3:[function(_dereq_,module,exports){

var Geometry = module.exports = {};

Geometry.POINT   = 'Point';
Geometry.LINE    = 'LineString';
Geometry.POLYGON = 'Polygon';

var proto = Geometry;

proto.getCentroid = function(featureParts) {
  var part, coordinates, tileX, tileY;

  if (!featureParts || !featureParts.length) {
    return;
  }

  if (featureParts.length === 1) {
    part = featureParts[0];
  } else {
    part = getLargestPart(featureParts);
  }

  if (!part) {
    return;
  }

  coordinates = part.feature.coordinates;
  tileX = part.tileCoords.x*256;
  tileY = part.tileCoords.y*256;

  if (part.feature.type === Geometry.POINT) {
    return {
      x: coordinates[0] + tileX,
      y: coordinates[1] + tileY
    };
  }

  if (part.feature.type === Geometry.POLYGON) {
    coordinates = coordinates[0];
  }

  var
    startX = coordinates[0], startY = coordinates[1],
    xTmp = 0, yTmp = 0,
    dx0, dy0,
    dx1, dy1,
    len, lenSum = 0;

  for (var i = 0, il = coordinates.length-3; i < il; i+=2) {
    dx0 = coordinates[i  ]-startX;
    dy0 = coordinates[i+1]-startY;
    dx1 = coordinates[i+2]-startX;
    dy1 = coordinates[i+3]-startY;

    len = dx0*dy1 - dx1*dy0;

    lenSum += len;
    xTmp += (dx1+dx0) * len;
    yTmp += (dy1+dy0) * len;
  }

  if (lenSum) {
    return {
      x: (xTmp/(3*lenSum)) + startX + tileX,
      y: (yTmp/(3*lenSum)) + startY + tileY
    };
  }

  return {
    x: startX + tileX,
    y: startY + tileY
  };
};

function getBBox(coordinates) {
  var
    min = Math.min,
    max = Math.max,
    minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;

  for (var i = 0, il = coordinates.length-1; i < il; i+=2) {
    minX = min(minX, coordinates[i]);
    maxX = max(maxX, coordinates[i]);
    minY = min(minY, coordinates[i+1]);
    maxY = max(maxY, coordinates[i+1]);
  }

  return { minX:minX, minY:minY, maxX:maxX, maxY:maxY };
}

function getArea(coordinates) {
  if (coordinates.length < 6) {
    return 0;
  }
  var sum = 0;
  for (var i = 0, il = coordinates.length-3; i < il; i+=2) {
    sum += (coordinates[i+2]-coordinates[i]) * (coordinates[i+1]+coordinates[i+3]);
  }
  sum += (coordinates[0]-coordinates[il]) * (coordinates[il+1]+coordinates[1]);
  return -sum/2;
}

function getLargestPart(featureParts) {
  var
    area, maxArea = -Infinity,
    part, maxPart,
    coordinates;

  for (var i = 0, il = featureParts.length; i < il; i++) {
    part = featureParts[i];
    coordinates = part.feature.coordinates;

    if (part.feature.type === Geometry.POLYGON) {
      coordinates = coordinates[0];
    }

    area = getArea(coordinates);

    if (area > maxArea) {
      maxArea = area;
      maxPart = part;
    }
  }

  return maxPart;
}

},{}],4:[function(_dereq_,module,exports){

var Geometry = _dereq_('./geometry');

// do this only when Leaflet exists (aka don't when run in web worker)
if (typeof L !== 'undefined') {
  var Tile = _dereq_('./tile');
  var Profiler = _dereq_('./profiler');

  var Layer = module.exports = L.TileLayer.extend({

    options: {
      maxZoom: 22
    },

    initialize: function(options) {
      // applies to a single tile but we don't want to check on per tile basis
      if (!options.provider) {
        throw new Error('VECNIK.Tile requires a data provider');
      }
      this._provider = options.provider;

      // TODO: use internal renderer as default
      // applies to a single tile but we don'T want to check on per tile basis
      if (!options.renderer) {
        throw new Error('VECNIK.Tile requires a renderer');
      }
      this._renderer = options.renderer;

      this._tileObjects = {};
      this._centroidPositions = {};

      L.TileLayer.prototype.initialize.call(this, '', options);
    },

    onAdd: function(map) {
      var self = this;
      //var proj = VECNIK.MercatorProjection()
      map.on('mousemove', function (e) {
//        var pos = map.project(e.latlng);
//        var tile = {
//          x: (pos.x/256)|0,
//          y: (pos.y/256)|0
//        };
//        var key = self._tileCoordsToKey(tile);
//        var tile_x = pos.x - 256*tile.x;
//        var tile_y = pos.y - 256*tile.y;
//        console.log(self._tileObjects[key].featureAt(tile_x, tile_y));
      });

      L.TileLayer.prototype.onAdd.call(this, map);
    },

    _removeTile: function(key) {
      delete this._tileObjects[key];
      L.TileLayer.prototype._removeTile.call(this, key);
    },

    createTile: function(coords) {
      var tile = new Tile({
        coords: coords,
        layer: this,
        provider: this._provider,
        renderer: this._renderer
      });

      var key = this._tileCoordsToKey(coords);
      this._tileObjects[key] = tile;

      return tile.getDomElement();
    },

    redraw: function(forceReload) {
      if (!!forceReload) {
        L.TileLayer.prototype.redraw.call(this);
        return;
      }
      var timer = Profiler.metric('tiles.render.time').start();
      this._centroidPositions = {};
      for (var key in this._tileObjects) {
        this._tileObjects[key].render();
      }
      timer.end();
    },

    getCentroid: function(feature) {
      var
        scale = Math.pow(2, this._map.getZoom()),
        pos;

      if (pos = this._centroidPositions[feature.groupId]) {
        return { x: pos.x*scale <<0, y: pos.y*scale <<0 };
      }

      var featureParts = this.getFeatureParts(feature.groupId);
      if (pos = Geometry.getCentroid(featureParts)) {
        this._centroidPositions[feature.groupId] = { x: pos.x/scale, y: pos.y/scale };
        return pos;
      }
    },

    getFeatureParts: function(groupId) {
      var
        tileObject,
        feature, f, fl,
        featureParts = [];

      for (var key in this._tileObjects) {
        tileObject = this._tileObjects[key];
        for (f = 0, fl = tileObject._data.length; f < fl; f++) {
          feature = tileObject._data[f];
          if (feature.groupId === groupId) {
            featureParts.push({ feature:feature, tileCoords:tileObject.getCoords() });
          }
        }
      }
      return featureParts;
    }
  });
}

},{"./geometry":3,"./profiler":7,"./tile":14}],5:[function(_dereq_,module,exports){
(function (global){

(function(global) {
  global.requestAnimationFrame = global.requestAnimationFrame ||
    global.mozRequestAnimationFrame ||
    global.webkitRequestAnimationFrame ||
    global.msRequestAnimationFrame ||
    function(callback) {
      return global.setTimeout(callback, 16);
    };

  global.Int32Array = global.Int32Array || global.Array,
  global.Uint8Array = global.Uint8Array || global.Array;

  if (!global.console) {
    global.console = {};
  }

}(self || window || global));

var VECNIK = _dereq_('./core/core');
VECNIK.CartoDB     = { API: _dereq_('./provider/cartodb') };
VECNIK.CartoShader = _dereq_('./shader');
VECNIK.CartoShaderLayer = _dereq_('./shader.layer');
VECNIK.Renderer    = _dereq_('./renderer');
VECNIK.Layer       = _dereq_('./layer');
// TODO: worker should use whatever reader the user defined
VECNIK.GeoJSON     = _dereq_('./reader/geojson'); // exposed for web worker
VECNIK.Geometry    = _dereq_('./geometry');
VECNIK.Profiler    = _dereq_('./profiler');

module.exports = VECNIK;

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./core/core":1,"./geometry":3,"./layer":4,"./profiler":7,"./provider/cartodb":8,"./reader/geojson":10,"./renderer":11,"./shader":12,"./shader.layer":13}],6:[function(_dereq_,module,exports){

var Tile = _dereq_('./tile');

// TODO: somehow Tile.SIZE gets lost on tile creation
//var tileSize = Tile ? Tile.SIZE : 256;
var tileSize = Tile.SIZE || 256;

var Point = function(x, y) {
  this.x = x || 0;
  this.y = y || 0;
};

function clamp(value, optMin, optMax) {
  if (optMin !== null) value = Math.max(value, optMin);
  if (optMax !== null) value = Math.min(value, optMax);
  return value;
}

function degreesToRadians(deg) {
  return deg * (Math.PI / 180);
}

function radiansToDegrees(rad) {
  return rad / (Math.PI / 180);
}


var MercatorProjection = module.exports = function() {
  this._pixelOrigin = new Point(tileSize / 2, tileSize / 2);
  this._pixelsPerLonDegree = tileSize / 360;
  this._pixelsPerLonRadian = tileSize / (2 * Math.PI);
};

MercatorProjection.prototype._fromLatLonToPoint = function(lat, lon) {
  var point = new Point(0, 0);
  var origin = this._pixelOrigin;

  point.x = origin.x + lon * this._pixelsPerLonDegree;

  // NOTE(appleton): Truncating to 0.9999 effectively limits latitude to
  // 89.189.  This is about a third of a tile past the edge of the world
  // tile.
  var siny = clamp(Math.sin(degreesToRadians(lat)), -0.9999, 0.9999);
  point.y = origin.y + 0.5 * Math.log((1 + siny) / (1 - siny)) * -this._pixelsPerLonRadian;
  return point;
};

MercatorProjection.prototype._fromPointToLatLon = function(point) {
  var me = this;
  var origin = me._pixelOrigin;
  var lon = (point.x - origin.x) / me._pixelsPerLonDegree;
  var latRadians = (point.y - origin.y) / -me._pixelsPerLonRadian;
  var lat = radiansToDegrees(2 * Math.atan(Math.exp(latRadians)) - Math.PI / 2);
  return { lat:lat, lon:lon };
};

MercatorProjection.prototype._tilePixelPos = function(tileX, tileY) {
  return {
    x: tileX*tileSize,
    y: tileY*tileSize
  };
};

MercatorProjection.prototype.tileBBox = function(x, y, zoom, bufferSize) {
  var numTiles = 1 <<zoom;
  bufferSize = bufferSize || 0;
  var inc =  (tileSize + bufferSize*2)/numTiles;
  var px = (x*tileSize - bufferSize  )/numTiles;
  var py = (y*tileSize - bufferSize  )/numTiles;
  return [
    this._fromPointToLatLon(new Point(px, py + inc)),
    this._fromPointToLatLon(new Point(px + inc, py))
  ];
};

MercatorProjection.prototype.latLonToTilePoint = function(lat, lon, tileX, tileY, zoom) {
  var numTiles = 1 <<zoom;
  var worldCoordinate = this._fromLatLonToPoint(lat, lon);
  var pixelCoordinate = new Point(worldCoordinate.x*numTiles, worldCoordinate.y*numTiles);
  var tilePixelPos    = this._tilePixelPos(tileX, tileY);
  return new Point(Math.round(pixelCoordinate.x-tilePixelPos.x), Math.round(pixelCoordinate.y-tilePixelPos.y));
};

},{"./tile":14}],7:[function(_dereq_,module,exports){
/*
# metrics profiler

## timing

```
 var timer = Profiler.metric('resource:load')
 time.start();
 ...
 time.end();
```

## counters

```
 var counter = Profiler.metric('requests')
 counter.inc();   // 1
 counter.inc(10); // 11
 counter.dec()    // 10
 counter.dec(10)  // 0
```

## Calls per second
```
  var fps = Profiler.metric('fps')
  function render() {
    fps.mark();
  }
```
*/

var MAX_HISTORY = 1024;
function Profiler() {}
Profiler.metrics = {};

Profiler.get = function(name) {
  return Profiler.metrics[name] || {
    max: 0,
    min: Number.MAX_VALUE,
    avg: 0,
    total: 0,
    count: 0,
    history: typeof(Float32Array) !== 'undefined' ? new Float32Array(MAX_HISTORY) : []
  };
};

Profiler.new_value = function (name, value) {
  var t = Profiler.metrics[name] = Profiler.get(name);

  t.max = Math.max(t.max, value);
  t.min = Math.min(t.min, value);
  t.total += value;
  ++t.count;
  t.avg = t.total / t.count;
  t.history[t.count%MAX_HISTORY] = value;
};

Profiler.print_stats = function () {
  for (var k in Profiler.metrics) {
    var t = Profiler.metrics[k];
    console.log(" === " + k + " === ");
    console.log(" max: " + t.max);
    console.log(" min: " + t.min);
    console.log(" avg: " + t.avg);
    console.log(" count: " + t.count);
    console.log(" total: " + t.total);
  }
};

function Metric(name) {
  this.t0 = null;
  this.name = name;
  this.count = 0;
}

Metric.prototype = {

  //
  // start a time measurement
  //
  start: function() {
    this.t0 = +new Date();
    return this;
  },

  // elapsed time since start was called
  _elapsed: function() {
    return +new Date() - this.t0;
  },

  //
  // finish a time measurement and register it
  // ``start`` should be called first, if not this
  // function does not take effect
  //
  end: function() {
    if (this.t0 !== null) {
      Profiler.new_value(this.name, this._elapsed());
      this.t0 = null;
    }
  },

  //
  // increments the value
  // qty: how many, default = 1
  //
  inc: function(qty) {
    qty = qty === undefined ? 1: qty;
    Profiler.new_value(this.name, Profiler.get(this.name).count + (qty ? qty: 0));
  },

  //
  // decrements the value
  // qty: how many, default = 1
  //
  dec: function(qty) {
    qty = qty === undefined ? 1: qty;
    this.inc(-qty);
  },

  //
  // measures how many times per second this function is called
  //
  mark: function() {
    ++this.count;
    if(this.t0 === null) {
      this.start();
      return;
    }
    var elapsed = this._elapsed();
    if(elapsed > 1) {
      Profiler.new_value(this.name, this.count);
      this.count = 0;
      this.start();
    }
  }
};

Profiler.metric = function(name) {
  return new Metric(name);
};

module.exports = Profiler;


},{}],8:[function(_dereq_,module,exports){
var CartoDB = _dereq_('./cartodb.sql');
var Projection = _dereq_('../mercator');
var Format = _dereq_('../reader/geojson');

var Provider = module.exports = function(options) {
  this._projection = new Projection();
  this.update(options);
};

var proto = Provider.prototype;

proto._debug = function(msg) {
  if (this._options.debug) {
    console.log(msg);
  }
};

proto._getUrl = function(x, y, zoom) {
  var sql = CartoDB.SQL(this._projection, this._options.table, x, y, zoom, this._options);
  this._debug(sql);
  return this._baseUrl +'?q='+ encodeURIComponent(sql) +'&format=geojson&dp=6';
};

proto.load = function(tileCoords, callback) {
  Format.load(this._getUrl(tileCoords.x, tileCoords.y, tileCoords.z), tileCoords, this._projection, callback);
};

proto.update = function(options) {
  this._options = options;
  this._baseUrl = 'http://'+ options.user +'.cartodb.com/api/v2/sql';

  if (this._options.ENABLE_SIMPLIFY === undefined) {
    this._options.ENABLE_SIMPLIFY = true;
  }
  if (this._options.ENABLE_SNAPPING === undefined) {
    this._options.ENABLE_SNAPPING = true;
  }
  if (this._options.ENABLE_CLIPPING === undefined) {
    this._options.ENABLE_CLIPPING = true;
  }
  if (this._options.ENABLE_FIXING === undefined) {
    this._options.ENABLE_FIXING = true;
  }
};

},{"../mercator":6,"../reader/geojson":10,"./cartodb.sql":9}],9:[function(_dereq_,module,exports){

var CartoDB = module.exports = {};

CartoDB.SQL = function(projection, table, x, y, zoom, opts) {

  opts = opts || {
    ENABLE_SIMPLIFY: true,
    ENABLE_CLIPPING: true,
    ENABLE_SNAPPING: true,
    ENABLE_FIXING:   true
  };

  var bbox = projection.tileBBox(x, y, zoom, opts.bufferSize);
  var geom_column = '"the_geom"';
  var geom_column_orig = '"the_geom"';
  var id_column = 'cartodb_id';
  var TILE_SIZE = 256;
  var tile_pixel_width = TILE_SIZE;
  var tile_pixel_height = TILE_SIZE;

  //console.log('-- ZOOM: ' + zoom);

  var tile_geo_width  = bbox[1].lon - bbox[0].lon;
  var tile_geo_height = bbox[1].lat - bbox[0].lat;

  var pixel_geo_width  = tile_geo_width  / tile_pixel_width;
  var pixel_geo_height = tile_geo_height / tile_pixel_height;

  //console.log('-- PIXEL_GEO_SIZE: '
  //  + pixel_geo_width + ' x ' + pixel_geo_height);

  var pixel_geo_maxsize = Math.max(pixel_geo_width, pixel_geo_height);
  //console.log('-- MAX_SIZE: ' + pixel_geo_maxsize);

  var tolerance = pixel_geo_maxsize / 2;
  //console.log('-- TOLERANCE: ' + tolerance);

  // simplify
  if (opts.ENABLE_SIMPLIFY) {
    geom_column = 'ST_Simplify('+ geom_column +', '+ tolerance +')';
    // may change type
    geom_column = 'ST_CollectionExtract('+ geom_column +', ST_Dimension('+ geom_column_orig +') + 1)';
  }

  // snap to a pixel grid
  if (opts.ENABLE_SNAPPING ) {
    geom_column = 'ST_SnapToGrid('+ geom_column +', '+ pixel_geo_maxsize +')';
    // may change type
    geom_column = 'ST_CollectionExtract('+ geom_column +', ST_Dimension('+ geom_column_orig +') + 1)';
  }

  // This is the query bounding box
  var sql_env = 'ST_MakeEnvelope('+
    bbox[0].lon +','+ bbox[0].lat +','+
    bbox[1].lon +','+ bbox[1].lat +', 4326)';

  // clip
  if (opts.ENABLE_CLIPPING) {
    // This is a slightly enlarged version of the query bounding box

    // var sql_env_exp = '('+ sql_env +')';
    var sql_env_exp = 'ST_Expand('+ sql_env +', '+ (pixel_geo_maxsize*120) +')';

    // Also must be snapped to the grid ...
    sql_env_exp = 'ST_SnapToGrid('+ sql_env_exp +','+ pixel_geo_maxsize +')';

    // snap to box
    geom_column = 'ST_Snap('+ geom_column +', '+ sql_env_exp +', '+ pixel_geo_maxsize +')';

    // Make valid (both ST_Snap and ST_SnapToGrid and ST_Expand
    if (opts.ENABLE_FIXING) {
      // NOTE: up to PostGIS-2.0.0 beta5 ST_MakeValid did not accept
      //       points nor GeometryCollection objects
      geom_column = 'CASE WHEN ST_Dimension('+
        geom_column +') = 0 OR GeometryType('+
        geom_column +") = 'GEOMETRYCOLLECTION' THEN "+
        geom_column +' ELSE ST_CollectionExtract(ST_MakeValid('+
        geom_column +'), ST_Dimension(' + geom_column_orig +
        ') + 1) END';
    }

    // clip by box
    geom_column = 'ST_Intersection('+ geom_column +', '+ sql_env_exp +')';
  }

  var columns = id_column +','+ geom_column +' as the_geom';
  if (opts.columns) {
    columns += ','+ opts.columns.join(',') +' ';
  }

  // profiling only
  if (opts.COUNT_ONLY) {
    columns = x +' AS x, '+ y +' AS y, SUM(st_npoints('+ geom_column +')) AS the_geom';
  }

  return 'SELECT '+ columns +' FROM '+ table +' WHERE the_geom && '+ sql_env; // +' LIMIT 100';
};

},{}],10:[function(_dereq_,module,exports){
var Core = _dereq_('../core/core');
var Geometry = _dereq_('../geometry');
var Projection = _dereq_('../mercator');

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

},{"../core/core":1,"../geometry":3,"../mercator":6}],11:[function(_dereq_,module,exports){

var Shader = _dereq_('./shader');
var Geometry = _dereq_('./geometry');

function getStrokeFillOrder(shadingOrder) {
  var
    shadingType,
    res = [];
  for (var i = 0, il = shadingOrder.length; i < il; i++) {
    shadingType = shadingOrder[i];
    if (shadingType === Shader.POLYGON) {
      res.push('fill');
    }
    if (shadingType === Shader.LINE) {
      res.push('stroke');
    }
  }
  return res;
}

function drawMarker(context, center, size) {
  // TODO: manage image sprites
  // TODO: precache render to a canvas
  context.arc(center.x, center.y, size, 0, Math.PI*2);
}

function drawLine(context, coordinates) {
  context.moveTo(coordinates[0], coordinates[1]);
  for (var i = 2, il = coordinates.length-2; i < il; i+=2) {
    context.lineTo(coordinates[i], coordinates[i+1]);
  }
};

function drawPolygon(context, coordinates) {
  for (var i = 0, il = coordinates.length; i < il; i++) {
    drawLine(context, coordinates[i]);
  }
};


var Renderer = module.exports = function(options) {
  options = options || {};
  if (!options.shader) {
    throw new Error('VECNIK.Renderer requires a shader');
  }

  this._shader = options.shader;
};

Renderer.POINT_RADIUS = 2;

var proto = Renderer.prototype;

proto.setShader = function(shader) {
  this._shader = shader;
};

proto.getShader = function() {
  return this._shader;
};

// render the specified collection in the contenxt
// mapContext contains the data needed for rendering related to the
// map state, for the moment only zoom
proto.render = function(tile, context, collection, mapContext) {
  var
    layer = tile.getLayer(),
    tileCoords = tile.getCoords(),
    layers = this._shader.getLayers(),
    collection,
    shaderLayer, style,
    shadingOrder, shadingType,
    strokeAndFill,
    i, il, j, jl, r, rl, s, sl,
    feature, coordinates,
		pos, labelX, labelY, labelText;

  context.clearRect(0, 0, context.canvas.width, context.canvas.height);

  for (s = 0, sl = layers.length; s < sl; s++) {
    shaderLayer = layers[s];
    shadingOrder = shaderLayer.getShadingOrder();
    strokeAndFill = getStrokeFillOrder(shadingOrder);


    // features are sorted according to their geometry type first
    // see https://gist.github.com/javisantana/7843f292ecf47f74a27d
    for (r = 0, rl = shadingOrder.length; r < rl; r++) {
      shadingType = shadingOrder[r];

      for (i = 0, il = collection.length; i < il; i++) {
        feature = collection[i];
        coordinates = feature.coordinates;

        // QUESTION: could we combine next 2 lines?
        style = shaderLayer.evalStyle(feature.properties, mapContext);

        if (shaderLayer.needsRender(shadingType, style)) {
          shaderLayer.apply(context, style);

          switch (shadingType) {
            case Shader.POINT:
              if (pos = layer.getCentroid(feature)) {
                drawMarker(context, pos, style['marker-width']);
                // TODO: fix logic of stroke/fill once per pass
                context.fill();
                context.stroke();
              }
            break;

            case Shader.LINE:
              if (feature.type === Geometry.POLYGON) {
                coordinates = coordinates[0]
              }
              context.beginPath();
              drawLine(context, coordinates);
              // TODO: fix logic of stroke/fill once per pass
              context.stroke();
            break;

            case Shader.POLYGON:
              // QUESTION: should we try to draw lines and points as well here?
              if (feature.type === Geometry.POLYGON) {
                context.beginPath();
                drawPolygon(context, coordinates);
                context.closePath();
                // TODO: fix logic of stroke/fill once per pass
                strokeAndFill[0] && context[ strokeAndFill[0] ]();
                strokeAndFill[1] && context[ strokeAndFill[1] ]();
              }
            break;

            case Shader.TEXT:
              if (pos = layer.getCentroid(feature)) {
                labelX = pos.x-tileCoords.x * 256;
                labelY = pos.y-tileCoords.y * 256;

                labelText = feature.groupId;
                // TODO: align state changes with shaderLayer.apply()
                context.save();
                // TODO: use CartoCSS for text
                context.lineCap = 'round';
                context.lineJoin = 'round';
                context.strokeStyle = 'rgba(255,255,255,1)';
                context.lineWidth = 4; // text outline width
                context.font = 'bold 11px sans-serif';
                context.textAlign = 'center';
                context.strokeText(style['text-name'], labelX, labelY);

                context.fillStyle = '#000';
                context.fillText(style['text-name'], labelX, labelY);
                context.restore();
              }
            break;
          }
        }
      }
    }
  }
};

// TODO: make sure, label has not yet been rendered somewhere else
// on render -> check other tiles, whether it has been drawn already
// TODO: avoid overlapping
// TODO: solve labels close outside tile border

},{"./geometry":3,"./shader":12}],12:[function(_dereq_,module,exports){

var Shader = module.exports = function(style) {
  this._layers = [];
  if (style) {
    this.update(style);
  }
};

var proto = Shader.prototype;

module.exports.LINE    = 'line';
module.exports.POLYGON = 'polygon';
module.exports.POINT   = 'markers';
module.exports.TEXT    = 'text';

// clones every layer in the shader
proto.clone = function() {
  var s = new Shader();
  for (var i = 0; i < this._layers.length; ++i) {
    s._layers.push(this._layers[i].clone());
  }
  return s;
};

proto.hitShader = function(attr) {
  var s = new Shader();
  for (var i = 0; i < this._layers.length; ++i) {
    s._layers.push(this._layers[i].clone().hitShader(attr));
  }
  return s;
};

proto.update = function(style) {
  // TODO: improve var naming
  var
    shader = new carto.RendererJS().render(style),
    layer, layerShader, sh, p;

  if (shader && shader.layers) {
    // requiring this late in order to avoid circular reference shader <-> shader.layer
    var ShaderLayer = _dereq_('./shader.layer');

    for (var i = 0, il = shader.layers.length; i < il; i++) {
      layer = shader.layers[i];

      // get shader from cartocss shader
      layerShader = layer.getShader();
      sh = {};
      for (p in layerShader) {
        if (layerShader[p].style) {
          sh[p] = layerShader[p].style;
        }
      }

      this._layers[i] = new ShaderLayer(sh, layer.getSymbolizers());
    }
  }
};

proto.getLayers = function() {
  return this._layers;
};

},{"./shader.layer":13}],13:[function(_dereq_,module,exports){

var Shader = _dereq_('./shader');
var Events = _dereq_('./core/events');

// properties needed for each geometry type to be renderered
var requiredProperties = {};
requiredProperties[Shader.POINT] = [
  'marker-width',
  'line-color'
];
requiredProperties[Shader.LINE] = [
  'line-color'
];
requiredProperties[Shader.POLYGON] = [
  'polygon-fill',
  'line-color'
];
requiredProperties[Shader.TEXT] = [
  'text-name',
  'text-fill'
];

// last context style applied, this is a shared variable
// for all the shaders
// could be shared across shader layersm but not urgently
var currentContextStyle = {};

var propertyMapping = {
  'marker-width': 'marker-width',
  'marker-fill': 'fillStyle',
  'marker-line-color': 'strokeStyle',
  'marker-line-width': 'lineWidth',
  'marker-color': 'fillStyle',
  'point-color': 'fillStyle',

  'line-color': 'strokeStyle',
  'line-width': 'lineWidth',
  'line-opacity': 'globalAlpha',

  'polygon-fill': 'fillStyle',
  'polygon-opacity': 'globalAlpha',

  'text-face-name': 'font',
  'text-size': 'font',
  'text-fill': 'fillStyle',
  'text-opacity': 'globalAlpha',
  'text-halo-fill': 'strokeStyle',
  'text-halo-radius': 'lineWidth',
  'text-align': 'textAlign',
  'text-name': 'text-name'
};

var ShaderLayer = module.exports = function(shader, shadingOrder) {
  Events.prototype.constructor.call(this);
  this._compiled = {};
  this._shadingOrder = shadingOrder || [
    Shader.POINT,
    Shader.POLYGON,
    Shader.LINE,
    Shader.TEXT
  ];
  this.compile(shader);
};

var proto = ShaderLayer.prototype = new Events();

proto.clone = function() {
  return new ShaderLayer(this._shaderSrc, this._shadingOrder);
};

proto.compile = function(shader) {
  this._shaderSrc = shader;
  if (typeof shader === 'string') {
    shader = function() {
      return shader;
    };
  }
  var property;
  for (var attr in shader) {
    if (property = propertyMapping[attr]) {
      this._compiled[property] = shader[attr];
    }
  }
  this.emit('change');
};

// given feature properties and map rendering content returns
// the style to apply to canvas context
// TODO: optimize this to not evaluate when featureProperties do not
// contain values involved in the shader
proto.evalStyle = function(featureProperties, mapContext) {
  mapContext = mapContext || {};
  var
    style = {},
    shader = this._compiled,
    // https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#5-for-in
    props = Object.keys(shader),
    prop, val;

  for (var i = 0, len = props.length; i < len; ++i) {
    prop = props[i];
    val = shader[prop];
    if (typeof val === 'function') {
      val = val(featureProperties, mapContext);
    }
    style[prop] = val;
  }
  return style;
},

// TODO: skip text related styles
proto.apply = function(context, style) {
  var
    currentStyle,
    changed = false,
    props = Object.keys(style),
    prop, val;

  for (var i = 0, len = props.length; i < len; ++i) {
    prop = props[i];
    // careful, setter context.fillStyle = '#f00' but getter context.fillStyle === '#ff0000' also upper case, lower case...
    //
    // color parse (and probably other props) depends on canvas implementation so direct
    // comparasions with context contents can't be done.
    // use an extra object to store current state
    // * chrome 35.0.1916.153:
    // ctx.strokeStyle = 'rgba(0,0,0,0.1)'
    // ctx.strokeStyle -> "rgba(0, 0, 0, 0.09803921568627451)"
    // * ff 29.0.1
    // ctx.strokeStyle = 'rgba(0,0,0,0.1)'
    // ctx.strokeStyle -> "rgba(0, 0, 0, 0.1)"
    val = style[prop];

    var id = context._shId;
    if (!id) {
      id = context._shId = Object.keys(currentContextStyle).length + 1;
      currentContextStyle[id] = {};
    }
    currentStyle = currentContextStyle[id];
    if (currentStyle[prop] !== val) {
      context[prop] = currentStyle[prop] = val;
      changed = true;
    }
  }
  return changed;
};

// TODO: only do text related styles
proto.textApply = function(context, style) {
  return this.apply(context, style);
};

proto.getShadingOrder = function() {
  return this._shadingOrder;
};

// return true if the feature need to be rendered
proto.needsRender = function(shadingType, style) {
  var props = requiredProperties[shadingType], p;

  for (var i = 0; i < props.length; ++i) {
    p = props[i];
    if (this._shaderSrc[p] && style[ propertyMapping[p] ]) {
      return true;
    }

if (p === 'text-name') {
  return true;
}

  }

  return false;
};

var RGB2Int = function(r, g, b) {
  return r | (g<<8) | (b<<16);
};

var Int2RGB = function(input) {
  var r = input & 0xff;
  var g = (input >> 8) & 0xff;
  var b = (input >> 16) & 0xff;
  return [r, g, b];
};


/**
 * return a shader clone ready for hit test.
 * @keyAttribute: string with the attribute used as key (usually the feature id)
 */
proto.hitShader = function(keyAttribute) {
  var hit = this.clone();
  // replace all fillStyle and strokeStyle props to use a custom
  // color
  for(var k in hit._compiled) {
    if (k === 'fillStyle' || k === 'strokeStyle') {
      //var p = hit._compiled[k];
      hit._compiled[k] = function(featureProperties, mapContext) {
        return 'rgb(' + Int2RGB(featureProperties[keyAttribute] + 1).join(',') + ')';
      };
    }
  }
  return hit;
};

// TODO: could be static methods of VECNIK.Shader
ShaderLayer.RGB2Int = RGB2Int;
ShaderLayer.Int2RGB = Int2RGB;

},{"./core/events":2,"./shader":12}],14:[function(_dereq_,module,exports){

var ShaderLayer = _dereq_('./shader.layer');

function createCanvas() {
  var
    canvas = document.createElement('CANVAS'),
    context = canvas.getContext('2d');

  canvas.width  = Tile.SIZE;
  canvas.height = Tile.SIZE;
  context.mozImageSmoothingEnabled = false;
  context.webkitImageSmoothingEnabled = false;

  return canvas;
}

var Tile = module.exports = function(options) {
  options = options || {};

  var
    canvas = this._canvas = createCanvas(),
    hitCanvas = this._hitCanvas = createCanvas();

  this._context = canvas.getContext('2d');
  this._hitContext = hitCanvas.getContext('2d');

  canvas.style.width  = canvas.width  +'px';
  canvas.style.height = canvas.height +'px';

  this._layer = options.layer;
  this._renderer = options.renderer;
  this._data = [];
  this._coords = options.coords;

  var self = this;
  options.provider.load(options.coords, function(data) {
    self._data = data;
    self.render();
  });
};

Tile.SIZE = 256;

var proto = Tile.prototype;



proto.getDomElement = function() {
  return this._canvas;
};

proto.getLayer = function() {
  return this._layer;
};

proto.getContext = function() {
  return this._context;
};

proto.getCoords = function() {
  return this._coords;
};

proto.render = function() {
  this._renderer.render(this, this._context, this._data, {
    zoom: this._coords.z
  });
};

/**
 * return hit grid
 */
proto._renderHitGrid = function() {
  // store current shader and use hitShader for rendering the grid
  var currentShader = this._renderer.getShader();
  this._renderer.setShader(currentShader.hitShader('cartodb_id'));
  this._renderer.render(this, this._hitContext, this._data, {
    zoom: this._coords.z
  });

  // restore shader
  this._renderer.setShader(currentShader);
  return this._hitContext.getImageData(0, 0, hitCanvas.width, hitCanvas.height).data;
};

/**
 * returns feature id at position. null for fo feature
 * @pos: point object like {x: X, y: Y }
 */
proto.featureAt = function(x, y) {
  if (!this._hitGrid) {
    this._hitGrid = this._renderHitGrid();
  }
  var idx = 4*((y|0) * Tile.SIZE + (x|0));
  var id = ShaderLayer.RGB2Int(
    this._hitGrid[idx],
    this._hitGrid[idx+1],
    this._hitGrid[idx+2]
  );
  if (id) {
    return id-1;
  }
  return null;
};

},{"./shader.layer":13}]},{},[5])
(5)
});