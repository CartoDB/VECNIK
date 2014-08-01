!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.VECNIK=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){

// TODO: stroke/fill order
// var shadingOrder, strokeAndFill;
// strokeAndFill = getStrokeFillOrder(shadingOrder);

var Canvas = module.exports = function(options) {
  options = options || {};

  var
    canvas  = this._canvas  = document.createElement('CANVAS'),
    context = this._context = canvas.getContext('2d');

  canvas.width  = options.width  || options.size || 0;
  canvas.height = options.height || options.size || 0;
  canvas.style.width  = canvas.width  +'px';
  canvas.style.height = canvas.height +'px';

  context.mozImageSmoothingEnabled    = false;
  context.webkitImageSmoothingEnabled = false;
  context.imageSmoothingEnabled       = false;

  context.lineCap  = 'round';
  context.lineJoin = 'round';

  this._state = {};
};

var proto = Canvas.prototype;

proto.getDomElement = function() {
  return this._canvas;
};

proto.getContext = function() {
  return this._context;
};

proto.clear = function() {
  this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
};

proto.getData = function() {
  return this._context.getImageData(0, 0, this._canvas.width, this._canvas.height).data;
};

proto.drawCircle = function(x, y, size, strokeFillOrder) {
  this._beginBatch('circle', strokeFillOrder);
  this._context.arc(x, y, size, 0, Math.PI*2);
};

proto.drawLine = function(coordinates) {
  this._beginBatch('line', 'S');
  var context = this._context;
  context.moveTo(coordinates[0], coordinates[1]);
  for (var i = 2, il = coordinates.length-1; i < il; i+=2) {
    context.lineTo(coordinates[i], coordinates[i+1]);
  }
};

proto.drawPolygon = function(coordinates, strokeFillOrder) {
  this._beginBatch('polygon', strokeFillOrder);

  var j, jl;
  var context = this._context;
  for (var i = 0, il = coordinates.length; i < il; i++) {
    context.moveTo(coordinates[i][0], coordinates[i][1]);
    for (j = 2, jl = coordinates[i].length-1; j < jl; j+=2) {
      context.lineTo(coordinates[i][j], coordinates[i][j+1]);
    }
  }
};

proto.drawText = function(text, x, y, align, stroke) {
  this._finishBatch();

  this.setStyle('textAlign', align);

  if (stroke) {
    this._context.strokeText(text, x, y);
  }

  this._context.fillText(text, x, y);
};

// TODO: rethink, whether a (newly) undefined value should cause this._finishBatch()
proto.setStyle = function(prop, value) {
  // checking for preset styles, for performance impacts see http://jsperf.com/osmb-context-props
  if (typeof value !== undefined && this._state[prop] !== value) {
    // finish previous stroke/fill operations, if any
    this._finishBatch();
    this._context[prop] = (this._state[prop] = value);
  }
};


proto._strokeFillMapping = {
  S: 'stroke',
  F: 'fill'
};

proto._beginBatch = function(operation, strokeFillOrder) {
// if (operation === 'polygon') console.log('BATCH', strokeFillOrder, this._state.fillStyle);

  if (this._operation === operation && this._strokeFillOrder === strokeFillOrder) {
    return;
  }
  this._finishBatch();
  this._operation = operation;
  this._strokeFillOrder = strokeFillOrder;
  this._context.beginPath();
};

proto._finishBatch = function() {
  if (!this._operation) {
    return;
  }

  var strokeFillOrder = this._strokeFillOrder;

  for (var i = 0, il = strokeFillOrder.length; i < il; i++) {
    this._context[ this._strokeFillMapping[ strokeFillOrder[i] ] ]();
  }

  this._operation = null;
  this._strokeFillOrder = null;
};

proto.setFont = function(size, face) {
  if (typeof size !== undefined || typeof face !== undefined) {
    size = size || this._state.fontSize;
    face = face || this._state.fontFace;
    if (this._state.fontSize !== size || this._state.fontFace !== face) {
      this._state.fontSize = size;
      this._state.fontFace = face;
      this._context.font = size +'px '+ face;
      return true;
    }
  }
};

proto.finishAll = function() {
  this._finishBatch();
};


/***
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
***/

},{}],2:[function(_dereq_,module,exports){

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

// TODO: make this configurable
Core.ID_COLUMN = 'cartodb_id';
},{}],3:[function(_dereq_,module,exports){

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

},{}],4:[function(_dereq_,module,exports){

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

},{}],5:[function(_dereq_,module,exports){

var VECNIK = _dereq_('./core/core');
var Geometry = _dereq_('./geometry');

// do this only when Leaflet exists (aka don't when run in web worker)
if (typeof L !== 'undefined') {
  var Tile = _dereq_('./tile');
  var Profiler = _dereq_('./profiler');

  var Layer = module.exports = L.TileLayer.extend({

    options: {
      maxZoom: 22
    },

    _renderQueue: [],

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

      var self = this;
      var lazyRender = function() {
        if (self._renderQueue.length) {
          var
            key = self._renderQueue[ self._renderQueue.length-1 ],
            tiles = self._tileObjects[self._map.getZoom()];

          if (tiles[key]) {
            tiles[key].render();
          }

          self._renderQueue.pop();
        }
      };
      setInterval(function() {
        requestAnimationFrame(lazyRender);
      }, 33);

      L.TileLayer.prototype.initialize.call(this, '', options);
    },

    _getFeatureFromPos: function(pos) {
      var tile = { x: (pos.x/256) | 0, y: (pos.y/256) | 0 };
      var key = this._tileCoordsToKey(tile);
      var tileX = pos.x - 256*tile.x;
      var tileY = pos.y - 256*tile.y;
      var tiles = this._tileObjects[this._map.getZoom()];

      if (!tiles[key]) {
        return null;
      }

      return tiles[key].getFeatureAt(tileX, tileY);
    },

    _getTileFromPos: function(pos) {
      var tile = { x: (pos.x/256) | 0, y: (pos.y/256) | 0 };
      var key = this._tileCoordsToKey(tile);
      return this._tiles[key];
    },

    _addToRenderQueue: function(key, withPriority) {
      var index = this._renderQueue.indexOf(key);

      if (index > -1) {
        if (withPriority) {
          // remove earlier duplicate
          this._renderQueue.splice(index, 1);
        } else {
          // keep later duplicate and don't do anything
          return;
        }
      }

      this._renderQueue[withPriority ? 'push' : 'unshift'](key);
    },

    _renderAffectedTiles: function(idColumn) {
      var tiles = this._tileObjects[this._map.getZoom()];
      requestAnimationFrame(function() {
        for (var key in tiles) {
          if (tiles[key].hasFeature(idColumn)) {
            tiles[key].render();
          }
        }
      });
    },

    _hoveredFeature: null,
    _clickedFeature: null,

    onAdd: function(map) {
      map.on('mousedown', function (e) {
        if (!this.options.interaction) {
          return;
        }

        // render previously highlighted tiles as normal
        if (this._clickedFeature) {
          this._renderAffectedTiles(this._clickedFeature[VECNIK.ID_COLUMN]);
        }

        this._clickedFeature = this._getFeatureFromPos(map.project(e.latlng));

        if (this._clickedFeature) {
          this._renderAffectedTiles(this._clickedFeature[VECNIK.ID_COLUMN]);

          this.fireEvent('featureClick', {
            feature: this._clickedFeature,
            geo: e.latlng,
            x: e.originalEvent.x,
            y: e.originalEvent.y
          });
        }
      }, this);

      map.on('mousemove', function (e) {
        if (!this.options.interaction) {
          return;
        }

        var pos = map.project(e.latlng);
        var tile = this._getTileFromPos(pos);
        var feature = this._getFeatureFromPos(pos);

        var payload = {
          geo: e.latlng,
          x: e.originalEvent.x,
          y: e.originalEvent.y
        };

        // mouse stays in same feature
        if (feature && this._hoveredFeature &&
          feature[VECNIK.ID_COLUMN] === this._hoveredFeature[VECNIK.ID_COLUMN]
        ) {
          payload.feature = this._hoveredFeature;
          this.fireEvent('featureOver', payload);
          return;
        }

        // mouse just left a feature
        if (this._hoveredFeature) {
          this._renderAffectedTiles(this._hoveredFeature[VECNIK.ID_COLUMN]);
          if (tile) {
            tile.style.cursor = 'inherit';
          }
          payload.feature = this._hoveredFeature;
          this.fireEvent('featureLeave', payload);
          this._hoveredFeature = null;
          return;
        }

        // mouse is outside any feature
        if (!feature) {
          delete payload.feature;
          this.fireEvent('featureOut', payload);
          return;
        }

        // mouse entered another feature
        this._hoveredFeature = feature;
        this._renderAffectedTiles(this._hoveredFeature[VECNIK.ID_COLUMN]);
        if (tile) {
          tile.style.cursor = 'pointer';
        }
        payload.feature = feature;
        this.fireEvent('featureEnter', payload);
      }, this);


      return L.TileLayer.prototype.onAdd.call(this, map);
    },

    _removeTile: function(key) {
      delete this._tileObjects[this._map.getZoom()][key];
      L.TileLayer.prototype._removeTile.call(this, key);
    },

    createTile: function(coords) {
      var tile = new Tile({
        coords: coords,
        layer: this,
        provider: this._provider,
        renderer: this._renderer
      });

      var
        key = this._tileCoordsToKey(coords),
        zoom = this._map.getZoom();

      (this._tileObjects[zoom] || (this._tileObjects[zoom] = []))[key] = tile;

      return tile.getDomElement();
    },

    redraw: function(forceReload) {
      this._renderQueue = [];

      if (!!forceReload) {
        this._centroidPositions = {};
        L.TileLayer.prototype.redraw.call(this);
        return this;
      }

      var timer = Profiler.metric('tiles.render.time').start();

      // get viewport tile bounds in order to render immediately, when visible
      var
        mapBounds = this._map.getPixelBounds(),
        tileSize = this._getTileSize(),
        tileBounds = L.bounds(
          mapBounds.min.divideBy(tileSize).floor(),
          mapBounds.max.divideBy(tileSize).floor()
        ),
        tiles = this._tileObjects[this._map.getZoom()];

      for (var key in tiles) {
        this._addToRenderQueue(key, tileBounds.contains(this._keyToTileCoords(key)));
      }

      timer.end();

      return this;
    },

    getCentroid: function(feature) {
      var
        scale = Math.pow(2, this._map.getZoom()),
        pos;

      if (pos = this._centroidPositions[feature.groupId]) {
        return { x: pos.x*scale <<0, y: pos.y*scale <<0 };
      }

      if (feature.type === Geometry.POINT) {
        pos = { x:feature.coordinates[0], y: feature.coordinates[1] };
      } else {
        var featureParts = this._getFeatureParts(feature.groupId);
        pos = Geometry.getCentroid(featureParts);
      }

      if (pos) {
        this._centroidPositions[feature.groupId] = { x: pos.x/scale, y: pos.y/scale };
        return pos;
      }
    },

    _getFeatureParts: function(groupId) {
      var
        tiles = this._tileObjects[this._map.getZoom()],
        tile,
        feature, f, fl,
        featureParts = [];

      for (var key in tiles) {
        tile = tiles[key];
        for (f = 0, fl = tile._data.length; f < fl; f++) {
          feature = tile._data[f];
          if (feature.groupId === groupId) {
            featureParts.push({ feature: feature, tileCoords: tile.getCoords() });
          }
        }
      }
      return featureParts;
    },

    setInteraction: function(flag) {
      this.options.interaction = !!flag;
      return this;
    },

    getHoveredFeature: function() {
      return this._hoveredFeature;
    },

    getClickedFeature: function() {
      return this._clickedFeature;
    }
  });
}

},{"./core/core":2,"./geometry":4,"./profiler":8,"./tile":15}],6:[function(_dereq_,module,exports){
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

VECNIK.Geometry    = _dereq_('./geometry');
VECNIK.Canvas      = _dereq_('./canvas');
VECNIK.CartoShader = _dereq_('./shader');
VECNIK.CartoShaderLayer = _dereq_('./shader.layer');
VECNIK.Renderer    = _dereq_('./renderer');

VECNIK.CartoDB     = { API: _dereq_('./provider/cartodb') };
VECNIK.Layer       = _dereq_('./layer');
// TODO: worker should use whatever reader the user defined
VECNIK.GeoJSON     = _dereq_('./reader/geojson'); // exposed for web worker
VECNIK.Profiler    = _dereq_('./profiler');

module.exports = VECNIK;

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./canvas":1,"./core/core":2,"./geometry":4,"./layer":5,"./profiler":8,"./provider/cartodb":9,"./reader/geojson":11,"./renderer":12,"./shader":13,"./shader.layer":14}],7:[function(_dereq_,module,exports){

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

},{"./tile":15}],8:[function(_dereq_,module,exports){
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


},{}],9:[function(_dereq_,module,exports){
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

// this is how cdn would be handled
//  this._baseUrl = 'http://3.ashbu.cartocdn.com/' + options.user +'/api/v1/sql';

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

},{"../mercator":7,"../reader/geojson":11,"./cartodb.sql":10}],10:[function(_dereq_,module,exports){

var VECNIK = _dereq_('../core/core');

var CartoDB = module.exports = {};

CartoDB.SQL = function(projection, table, x, y, zoom, options) {

  options = options || {
    ENABLE_SIMPLIFY: true,
    ENABLE_CLIPPING: true,
    ENABLE_SNAPPING: true,
    ENABLE_FIXING:   true
  };

  var bbox = projection.tileBBox(x, y, zoom, options.bufferSize);
  var geom_column = '"the_geom"';
  var geom_column_orig = '"the_geom"';
  var id_column = options.idColumn || VECNIK.ID_COLUMN; // though we dont't like the id column to be set manually,
                                                    // it allows us to have a different id column for OSM access
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
  if (options.ENABLE_SIMPLIFY) {
    geom_column = 'ST_Simplify('+ geom_column +', '+ tolerance +')';
    // may change type
    geom_column = 'ST_CollectionExtract('+ geom_column +', ST_Dimension('+ geom_column_orig +') + 1)';
  }

  // snap to a pixel grid
  if (options.ENABLE_SNAPPING ) {
    geom_column = 'ST_SnapToGrid('+ geom_column +', '+ pixel_geo_maxsize +')';
    // may change type
    geom_column = 'ST_CollectionExtract('+ geom_column +', ST_Dimension('+ geom_column_orig +') + 1)';
  }

  // This is the query bounding box
  var sql_env = 'ST_MakeEnvelope('+
    bbox[0].lon +','+ bbox[0].lat +','+
    bbox[1].lon +','+ bbox[1].lat +', 4326)';

  var filter = 'the_geom && '+ sql_env;

  if (options.filter) {
    filter += ' AND '+ options.filter;
  }

  // clip
  if (options.ENABLE_CLIPPING) {
    // This is a slightly enlarged version of the query bounding box

    // var sql_env_exp = '('+ sql_env +')';
    var sql_env_exp = 'ST_Expand('+ sql_env +', '+ (pixel_geo_maxsize*120) +')';

    // Also must be snapped to the grid ...
    sql_env_exp = 'ST_SnapToGrid('+ sql_env_exp +','+ pixel_geo_maxsize +')';

    // snap to box
    geom_column = 'ST_Snap('+ geom_column +', '+ sql_env_exp +', '+ pixel_geo_maxsize +')';

    // Make valid (both ST_Snap and ST_SnapToGrid and ST_Expand
    if (options.ENABLE_FIXING) {
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
  if (options.columns) {
    columns += ','+ options.columns.join(',') +' ';
  }

  // profiling only
  if (options.COUNT_ONLY) {
    columns = x +' AS x, '+ y +' AS y, SUM(st_npoints('+ geom_column +')) AS the_geom';
  }

  return 'SELECT '+ columns +' FROM '+ table +' WHERE '+ filter; // +' LIMIT 100';
};

},{"../core/core":2}],11:[function(_dereq_,module,exports){
var VECNIK = _dereq_('../core/core');
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
    // TODO: per definition it should be feature.id
    // it's named 'groupId' instead of just 'id' as it can occur multiple times for multi-geometries or geometries cut by tile borders!
    groupId = feature.id || feature.properties.id || feature.properties[VECNIK.ID_COLUMN];
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
    VECNIK.load(url, function(collection) {
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

},{"../core/core":2,"../geometry":4,"../mercator":7}],12:[function(_dereq_,module,exports){

var Shader = _dereq_('./shader');
var Geometry = _dereq_('./geometry');

function getStrokeFillOrder(shadingOrder) {
  var
    symbolizer,
    res = '';
  for (var i = 0, il = shadingOrder.length; i < il; i++) {
    symbolizer = shadingOrder[i];
    if (symbolizer === Shader.POLYGON) {
      res += 'F';
    }
    if (symbolizer === Shader.LINE) {
      res += 'S';
    }
  }
  return res;
}

var Renderer = module.exports = function(options) {
  options = options || {};
  if (!options.shader) {
    throw new Error('VECNIK.Renderer requires a shader');
  }

  this._shader = options.shader;
};

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
proto.render = function(tile, canvas, collection, mapContext) {
  var
    layer = tile.getLayer(),
    tileCoords = tile.getCoords(),
    layers = this._shader.getLayers(),
    collection,
    shaderLayer, style,
    shadingOrder, symbolizer,
    strokeFillOrder,
    i, il, r, rl, s, sl,
    feature, coordinates,
		pos;

  canvas.clear();

  // for render order see https://gist.github.com/javisantana/7843f292ecf47f74a27d

//var start = Date.now();

  for (s = 0, sl = layers.length; s < sl; s++) {
    shaderLayer = layers[s];
    shadingOrder = shaderLayer.getShadingOrder();
    strokeFillOrder = getStrokeFillOrder(shadingOrder);

    for (r = 0, rl = shadingOrder.length; r < rl; r++) {
      symbolizer = shadingOrder[r];

      for (i = 0, il = collection.length; i < il; i++) {
        feature = collection[i];
        coordinates = feature.coordinates;

        style = shaderLayer.getStyle(feature.properties, mapContext);
        switch (symbolizer) {
          case Shader.POINT:
            if ((pos = layer.getCentroid(feature)) && style.markerSize && style.markerFill) {
              canvas.setStyle('strokeStyle', style.markerStrokeStyle);
              canvas.setStyle('lineWidth',   style.markerLineWidth);
              canvas.setStyle('fillStyle',   style.markerFill);

//              canvas.drawCircle(pos.x-tileCoords.x * 256, pos.y-tileCoords.y * 256, style.markerSize, strokeFillOrder);
canvas.drawCircle(pos.x, pos.y, 10, 'FS');
            }
          break;

          case Shader.LINE:
            if (style.strokeStyle) {
              if (feature.type === Geometry.POLYGON) {
                coordinates = coordinates[0];
              }

              canvas.setStyle('strokeStyle', style.strokeStyle);
              canvas.setStyle('lineWidth',   style.LineWidth);

              canvas.drawLine(coordinates);
            }
          break;

          case Shader.POLYGON:
            if (feature.type === Geometry.POLYGON && (style.strokeStyle || style.polygonFill)) {

              canvas.setStyle('strokeStyle', style.polygonStrokeStyle);
              canvas.setStyle('lineWidth',   style.polygonLineWidth);
              canvas.setStyle('fillStyle',   style.polygonFill);

              canvas.drawPolygon(coordinates, strokeFillOrder);
            }
          break;

          case Shader.TEXT:
            // TODO: solve labels closely beyond tile border
            if ((pos = layer.getCentroid(feature)) && style.textContent) {
              canvas.setFont(style.fontSize, style.fontFace);
              canvas.setStyle('strokeStyle', style.textStrokeStyle);
              canvas.setStyle('lineWidth',   style.textLineWidth);
              canvas.setStyle('fillStyle',   style.textFill);

              canvas.drawText(style.textContent, pos.x-tileCoords.x * 256, pos.y-tileCoords.y * 256, style.textAlign, !!style.textStrokeStyle);
            }
          break;
        }
      }
      canvas.finishAll();
    }
  }
//console.log('RENDER TILE', Date.now()-start);
};

},{"./geometry":4,"./shader":13}],13:[function(_dereq_,module,exports){

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
proto.createHitShader = function(key) {
  var hitShader = new Shader();
  for (var i = 0; i < this._layers.length; i++) {
    hitShader._layers.push(this._layers[i].createHitShaderLayer(key));
  }
  return hitShader;
};

proto.update = function(style) {
  var cartoShader = new carto.RendererJS().render(style);

  if (!cartoShader || !cartoShader.layers) {
    return;
  }

  // requiring this late in order to avoid circular reference shader <-> shader.layer
  var ShaderLayer = _dereq_('./shader.layer');

  var cartoShaderLayer;
  for (var i = 0, il = cartoShader.layers.length; i < il; i++) {
    cartoShaderLayer = cartoShader.layers[i];
    this._layers[i] = new ShaderLayer(
      cartoShaderLayer.fullName(),
      this._cloneProperties(cartoShaderLayer.getShader()),
      cartoShaderLayer.getSymbolizers()
    );
  }
};

proto._cloneProperties = function(shader) {
  var cloned = {};
  for (var prop in shader) {
    if (shader[prop].style) {
      cloned[prop] = shader[prop].style;
    }
  }
  return cloned;
};

proto.getLayers = function() {
  return this._layers;
};

},{"./shader.layer":14}],14:[function(_dereq_,module,exports){

var VECNIK = _dereq_('./core/core');
var Events = _dereq_('./core/events');
var Shader = _dereq_('./shader');

var propertyMapping = {
  'marker-width': 'markerSize',
  'marker-fill': 'markerFill',
  'marker-line-color': 'markerStrokeStyle',
  'marker-line-width': 'markerLineWidth',
  'marker-color': 'markerFill',
  'point-color': 'markerFill',
  'marker-opacity': 'markerAlpha', // does that exist?

  'line-color': 'strokeStyle',
  'line-width': 'lineWidth',
  'line-opacity': 'lineAlpha',

  'polygon-fill': 'polygonFill',
  'polygon-opacity': 'polygonAlpha',

  'text-face-name': 'fontFace',
  'text-size': 'fontSize',
  'text-fill': 'textFill',
  'text-opacity': 'textAlpha',
  'text-halo-fill': 'textStrokeStyle',
  'text-halo-radius': 'textLineWidth',
  'text-align': 'textAlign',
  'text-name': 'textContent'
};

var ShaderLayer = module.exports = function(name, shaderSrc, shadingOrder) {
  Events.prototype.constructor.call(this);

  this._name = name || '';

  this._compiled = {};
  this.compile(shaderSrc);

  this._shadingOrder = shadingOrder || [
    Shader.POINT,
    Shader.POLYGON,
    Shader.LINE,
    Shader.TEXT
  ];
};

var proto = ShaderLayer.prototype = new Events();

proto.clone = function() {
  return new ShaderLayer(this._name, this._shaderSrc, this._shadingOrder);
};

proto.compile = function(shaderSrc) {
  this._shaderSrc = shaderSrc;
  if (typeof shaderSrc === 'string') {
    shaderSrc = function() {
      return shaderSrc;
    };
  }
  var property;
  for (var attr in shaderSrc) {
    if (property = propertyMapping[attr]) {
      this._compiled[property] = shaderSrc[attr];
    }
  }
  this.emit('change');
};

// given feature properties and map rendering content returns
// the style to apply to canvas context
// TODO: optimize this to not evaluate when featureProperties do not
// contain values involved in the shader
proto.getStyle = function(featureProperties, mapContext) {
  mapContext = mapContext || {};

  var
    style = {},
    nameAttachment = this._name.split('::')[1];

  if (nameAttachment === 'hover') {
    if (!mapContext.hovered || mapContext.hovered[VECNIK.ID_COLUMN] !== featureProperties[VECNIK.ID_COLUMN]) {
      return style;
    }
    }

  if (nameAttachment === 'click') {
    if (!mapContext.clicked || mapContext.clicked[VECNIK.ID_COLUMN] !== featureProperties[VECNIK.ID_COLUMN]) {
      return style;
    }
  }

  var
    style = {},
    compiled = this._compiled,
    // https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#5-for-in
    props = Object.keys(compiled),
    prop, val;

  for (var i = 0, len = props.length; i < len; ++i) {
    prop = props[i];
    val = compiled[prop];

    if (typeof val === 'function') {
      val = val(featureProperties, mapContext);
    }
    style[prop] = val;
  }

  return style;
};

proto.getShadingOrder = function() {
  return this._shadingOrder;
};

/**
 * return a shader clone ready for hit test.
 */
proto.createHitShaderLayer = function(idColumn) {
  var hitLayer = this.clone();
  for (var k in hitLayer._compiled) {
    hitLayer._compiled[k] = function(featureProperties, mapContext) {
      return 'rgb(' + Int2RGB(featureProperties[idColumn] + 1).join(',') + ')';
    };
  }

  // clone symbolizers and skip texts in hit layer
  hitLayer._shadingOrder = [];
  for (var i = 0, il = this._shadingOrder.length; i < il; i++) {
    if (this._shadingOrder[i] !== 'text') {
      hitLayer._shadingOrder.push(this._shadingOrder[i]);
    }
  }
  return hitLayer;
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

// TODO: could be static methods of VECNIK.Shader
ShaderLayer.RGB2Int = RGB2Int;
ShaderLayer.Int2RGB = Int2RGB;

},{"./core/core":2,"./core/events":3,"./shader":13}],15:[function(_dereq_,module,exports){

var VECNIK = _dereq_('./core/core');
var ShaderLayer = _dereq_('./shader.layer');
var Canvas = _dereq_('./canvas');

var Tile = module.exports = function(options) {
  options = options || {};

  this._canvas = new Canvas({ size: Tile.SIZE }),
  this._hitCanvas = new Canvas({ size: Tile.SIZE });

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
  return this._canvas.getDomElement();
};

proto.getLayer = function() {
  return this._layer;
};

proto.getCoords = function() {
  return this._coords;
};

proto.render = function() {
  var
    mapContext = { zoom: this._coords.z },
    hovered, clicked;

  if (hovered = this._layer.getHoveredFeature()) {
    mapContext.hovered = hovered;
  }

  if (clicked = this._layer.getClickedFeature()) {
    mapContext.clicked = clicked;
  }

  this._renderer.render(this, this._canvas, this._data, mapContext);
};

/**
 * return hit grid
 */
proto._renderHitGrid = function() {
  // store current shader and use hitShader for rendering the grid
  var currentShader = this._renderer.getShader();
  this._renderer.setShader(currentShader.createHitShader(VECNIK.ID_COLUMN));
  this._renderer.render(this, this._hitCanvas, this._data, {
    zoom: this._coords.z
  });

  // restore shader
  this._renderer.setShader(currentShader);

  var data = this._hitCanvas.getData();

  // check, whether somethisng has been drawn
  // TODO: maybe shader was not ready. try to check this instead
  for (var i = 0; i < data.length; i++) {
    if (data[i]) {
      return data;
    }
  }

//  console.log('FAILED to render hit canvas');
};

/**
 * returns feature id at position. null for fo feature
 * @pos: point object like {x: X, y: Y }
 */
proto.getFeatureAt = function(x, y) {
  if (!this._hitGrid) {
    this._hitGrid = this._renderHitGrid();
  }

  if (!this._hitGrid) {
    return;
  }

  var i = 4*((y|0) * Tile.SIZE + (x|0));

  if (this._hitGrid[i+3] < 255) {
    return;
  }

  var id = ShaderLayer.RGB2Int(
    this._hitGrid[i  ],
    this._hitGrid[i+1],
    this._hitGrid[i+2]
  );

  if (!id) {
    return;
  }

  // TODO: return the real feature
  var feature = {};
  feature[VECNIK.ID_COLUMN] = id-1;
  return feature;
};

proto.hasFeature = function(groupId) {
  for (var i = 0, il = this._data.length; i < il; i++) {
    if (this._data[i].groupId === groupId) {
      return true;
    }
  }
  return false;
};

},{"./canvas":1,"./core/core":2,"./shader.layer":14}]},{},[6])
(6)
});