
var ShaderLayer = require('./shader.layer');
var Canvas      = require('./canvas');
var Profiler    = require('./profiler');

var Tile = module.exports = function(options) {
  options = options || {};

  this._tileSize = options.size || 256;
  this._canvas = new Canvas({ size: this._tileSize }),
  this._hitCanvas = new Canvas({ size: this._tileSize });

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

proto.getSize = function() {
  return this._tileSize;
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

  var profiler = Profiler.metric('tile.rendertime').start();
  this._renderer.render(this, this._canvas, this._data, mapContext);
  profiler.end();
};

/**
 * return hit grid
 */
proto._renderHitGrid = function() {
  // store current shader and use hitShader for rendering the grid
  var currentShader = this._renderer.getShader();
  this._renderer.setShader(currentShader.createHitShader());
  this._renderer.render(this, this._hitCanvas, this._data, {
    zoom: this._coords.z
  });

  // restore shader
  this._renderer.setShader(currentShader);

  var data = this._hitCanvas.getData();

  // check, whether something has been drawn
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

  var i = 4*((y|0) * this._tileSize + (x|0));

  if (this._hitGrid[i+3] < this._tileSize-1) {
    return;
  }

  var cartodb_id = ShaderLayer.RGB2Int(
    this._hitGrid[i  ],
    this._hitGrid[i+1],
    this._hitGrid[i+2]
  );

  if (!cartodb_id) {
    return;
  }

  var feature = this.getFeature(cartodb_id-1);
  if (feature) {
    return feature.properties;
  }
};

proto.getFeature = function(cartodb_id) {
  for (var i = 0, il = this._data.length; i < il; i++) {
    if (this._data[i].properties.cartodb_id === cartodb_id) {
      return this._data[i];
    }
  }
  return;
};
