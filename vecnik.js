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

},{}],4:[function(_dereq_,module,exports){

var Tile = _dereq_('./tile');

var Layer = module.exports = L.TileLayer.extend({

  options: {
    maxZoom: 20
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

    L.TileLayer.prototype.initialize.call(this, '', options);
  },

  createTile: function(coords) {
    var tile = new Tile({
      coords: coords,
      provider: this._provider,
      renderer: this._renderer
    });

    return tile.getDomElement();
  }
});

},{"./tile":13}],5:[function(_dereq_,module,exports){
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

module.exports = {
  CartoDB: {
    API: _dereq_('./provider/cartodb')
  },
  CartoShader: _dereq_('./shader'),
  Renderer: _dereq_('./renderer'),
  Layer: _dereq_('./layer')
};
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./layer":4,"./provider/cartodb":7,"./renderer":10,"./shader":11}],6:[function(_dereq_,module,exports){

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

},{"./tile":13}],7:[function(_dereq_,module,exports){
var CartoDB = _dereq_('./cartodb.sql');
var Projection = _dereq_('../mercator');
var Format = _dereq_('../reader/geojson');

var Provider = module.exports = function(options) {
  this._options = options;
  this._projection = new Projection();
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

},{"../mercator":6,"../reader/geojson":9,"./cartodb.sql":8}],8:[function(_dereq_,module,exports){

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

},{}],9:[function(_dereq_,module,exports){
var Core = _dereq_('../core/core');
var Geometry = _dereq_('../geometry');
var Projection = _dereq_('../mercator');

function _addPoint(geoCoords, projection, properties, tileCoords, dataByRef) {
  dataByRef.push({
    type: Geometry.POINT,
    coordinates: _toBuffer([geoCoords], projection, tileCoords),
    properties: properties
  });
}

function _addLineString(geoCoords, projection, properties, tileCoords, dataByRef) {
  dataByRef.push({
    type: Geometry.LINE,
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
      case Geometry.POINT:
        _addPoint(geoCoords, projection, properties, tileCoords, dataByRef);
      break;

      case 'Multi'+ Geometry.POINT:
        for (m = 0, ml = geoCoords.length; m < ml; m++) {
          _addPoint(geoCoords[m], projection, _copy(properties), tileCoords, dataByRef);
        }
      break;

      case Geometry.LINE:
        _addLineString(geoCoords, projection, properties, tileCoords, dataByRef);
      break;

      case 'Multi'+ Geometry.LINE:
        for (m = 0, ml = geoCoords.length; m < ml; m++) {
          _addLineString(geoCoords[m], projection, _copy(properties), tileCoords, dataByRef);
        }
      break;

      case Geometry.POLYGON:
        _addPolygon(geoCoords, projection, properties, tileCoords, dataByRef);
      break;

      case 'Multi'+ Geometry.POLYGON:
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

},{"../core/core":1,"../geometry":3,"../mercator":6}],10:[function(_dereq_,module,exports){

var Geometry = _dereq_('./geometry');

var orderMethods = {};
orderMethods[Geometry.POLYGON] = 'fill';
orderMethods[Geometry.LINE] = 'stroke';

var Renderer = module.exports = function(options) {
  options = options || {};
  if (!options.shader) {
    throw new Error('VECNIK.Renderer requires a shader');
  }

  this._shader = options.shader;
};

Renderer.POINT_RADIUS = 2;

var proto = Renderer.prototype;

proto._drawLineString = function(context, coordinates) {
  context.moveTo(coordinates[0], coordinates[1]);
  for (var i = 2, il = coordinates.length-2; i < il; i+=2) {
    context.lineTo(coordinates[i], coordinates[i+1]);
  }
};

proto._drawMarker = function (context, coordinates, size) {
  //TODO: manage image sprites
  //TODO: precache render to a canvas
  context.arc(coordinates[0], coordinates[1], size, 0, Math.PI*2);
};

// render the specified collection in the contenxt
// mapContext contains the data needed for rendering related to the
// map state, for the moment only zoom
proto.render = function(context, collection, mapContext) {
  var
    shaders = this._shader.getLayers(),
    shaderPass, style,
    i, il, j, jl, s, sl,
    feature, coordinates;

  context.clearRect(0, 0, context.canvas.width, context.canvas.height);

  for (s = 0, sl = shaders.length; s < sl; s++) {
    shaderPass = shaders[s];

    for (i = 0, il = collection.length; i < il; i++) {
      feature = collection[i];

      style = shaderPass.evalStyle(feature.properties, mapContext);

      coordinates = feature.coordinates;

      if (shaderPass.needsRender(feature.type, style)) {
        context.beginPath();

        switch(feature.type) {
          case Geometry.POINT:
            this._drawMarker(context, coordinates, style['marker-width']);
          break;

          case Geometry.LINE:
            this._drawLineString(context, coordinates);
          break;

          case Geometry.POLYGON:
            for (j = 0, jl = coordinates.length; j < jl; j++) {
              this._drawLineString(context, coordinates[j]);
            }
            context.closePath();
          break;
        }

        if (shaderPass.apply(context, style)) {
          // TODO: stroke/fill here if the style has changed to close previous polygons
        }

        var order = shaderPass.renderOrder();
        if (feature.type === Geometry.POLYGON ||
            feature.type === Geometry.LINE) {
          context[orderMethods[order[0]]]();
          order.length >=1 && context[orderMethods[order[1]]]();
        } else if (feature.type === Geometry.POINT) {
          // if case it's a point there is no render order, fill and stroke
          context.fill();
          context.stroke();
        }
      }
    }
  }
};

},{"./geometry":3}],11:[function(_dereq_,module,exports){

var Geometry = _dereq_('./geometry');
var ShaderLayer = _dereq_('./shader.layer');

var Shader = module.exports = function(style) {
  this.update(style);
};

var proto = Shader.prototype;

proto.update = function(style) {
  this._layers = [];
  var
    shader = new carto.RendererJS().render(style),
    layer, order, layerShader, sh, p,
    geometryTypeMapping = {
      line: Geometry.LINE,
      polygon: Geometry.POLYGON,
      markers: Geometry.POINT
    };

  if (shader && shader.layers) {
    for (var i = 0, il = shader.layers.length; i < il; i++) {
      layer = shader.layers[i];

      // order from cartocss
      order = layer.getSymbolizers().map(function(s) {
        return geometryTypeMapping[s];
      });

      // get shader from cartocss shader
      layerShader = layer.getShader();
      sh = {};
      for (p in layerShader) {
        if (layerShader[p].style) {
          sh[p] = layerShader[p].style;
        }
      }

      this._layers[i] = new ShaderLayer(sh, order);
    }
  }
};

proto.getLayers = function() {
  return this._layers;
};

},{"./geometry":3,"./shader.layer":12}],12:[function(_dereq_,module,exports){

var Geometry = _dereq_('./geometry');
var Events = _dereq_('./core/events');


// properties needed for each geometry type to be renderered
var requiredProperties = {
  point: [
    'marker-width',
    'line-color'
  ],
  linestring: [
    'line-color'
  ],
  polygon: [
    'polygon-fill',
    'line-color'
  ]
};
requiredProperties.multipolygon = requiredProperties.polygon;

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
  'polygon-opacity': 'globalAlpha'
};

var ShaderLayer = module.exports = function(shader, renderOrder) {
  Events.prototype.constructor.call(this);
  this._compiled = {};
  this._renderOrder = renderOrder || [
    Geometry.POINT,
    Geometry.POLYGON,
    Geometry.LINE
  ];
  this.compile(shader);
};

var proto = ShaderLayer.prototype = new Events();

proto.compile = function(shader) {
  this._shaderSrc = shader;
  if (typeof shader === 'string') {
    shader = function() { return shader; };
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
      currentContextStyle[id] = {}
    }
    currentStyle = currentContextStyle[id];
    if (currentStyle[prop] !== val) {
      context[prop] = currentStyle[prop] = val;
      changed = true;
    }
  }
  return changed;
};

proto.renderOrder = function() {
  return this._renderOrder;
},

// return true if the feature need to be rendered
proto.needsRender = function(geometryType, style) {
  // check properties in the shader first
  var
    props = requiredProperties[geometryType.toLowerCase()],
    p;

  // ¿?
  if (!props) {
    return false;
  }

  for (var i = 0; i < props.length; ++i) {
    p = props[i];
    if (this._shaderSrc[p]) {
      if (style[propertyMapping[p]]) {
        return true;
      }
    }
  }
  return false;
};

},{"./core/events":2,"./geometry":3}],13:[function(_dereq_,module,exports){

var Tile = module.exports = function(options) {
  options = options || {};

  var
    canvas  = this._canvas  = document.createElement('CANVAS'),
    context = this._context = canvas.getContext('2d');

  canvas.width  = Tile.SIZE;
  canvas.height = Tile.SIZE;

  canvas.style.width  = canvas.width  +'px';
  canvas.style.height = canvas.height +'px';

  context.mozImageSmoothingEnabled = false;
  context.webkitImageSmoothingEnabled = false;

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

proto.render = function() {
  this._renderer.render(this._context, this._data, {
    zoom: this._coords.z
  });
};

},{}]},{},[5])
(5)
});