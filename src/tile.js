
var ShaderLayer = require('./shader.layer');

var Tile = module.exports = function(options) {
  options = options || {};

  var
    container = this._container = document.createElement('DIV'),
    canvas    = document.createElement('CANVAS'),
    context   = this._context = canvas.getContext('2d'),
    overlay   = this._overlay = document.createElement('DIV');

  container.appendChild(canvas);
  container.appendChild(overlay);

  canvas.width  = Tile.SIZE;
  canvas.height = Tile.SIZE;

  canvas.style.width  = canvas.width  +'px';
  canvas.style.height = canvas.height +'px';
  canvas.style.zIndex = 0;

  overlay.style.width  = canvas.width  +'px';
  overlay.style.height = canvas.height +'px';
  overlay.style.backgroundColor = 'rgba(240,220,0,0.5)';

  context.mozImageSmoothingEnabled = false;
  context.webkitImageSmoothingEnabled = false;

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

function createCanvas() {
  var canvas  = document.createElement('CANVAS');
  canvas.width  = Tile.SIZE;
  canvas.height = Tile.SIZE;
  return canvas;
}

var proto = Tile.prototype;

proto.getDomElement = function() {
  return this._container;
};

proto.render = function() {
  this._renderer.render(this._layer, this._context, this._data, {
    zoom: this._coords.z
  });
  this._renderer.renderLabels(this._layer, this._overlay, this._data, {
    zoom: this._coords.z
  });
};

/**
 * return hit grid
 */
proto._renderHitCanvas = function() {
  var canvas = createCanvas();
  var context = canvas.getContext('2d');
  context.mozImageSmoothingEnabled = false;
  context.webkitImageSmoothingEnabled = false;

  // save current shader and use hitShader for rendering the grid
  var currentShader = this._renderer.shader();
  this._renderer.shader(currentShader.hitShader('cartodb_id'));
  this._renderer.render(this._layer, context, this._data, {
    zoom: this._coords.z
  });

  // retore shader
  this._renderer.shader(currentShader);
  return context.getImageData(0, 0, canvas.width, canvas.height).data;
};

/**
 * returns feature id at position. null for fo feature
 * @pos: point object like {x: X, y: Y }
 */
proto.featureAt = function(x, y) {

  if (!this._hitGrid) {
    this._hitGrid = this._renderHitCanvas();
  }
  var idx = 4*((y|0) * Tile.SIZE + (x|0));
  var r = this._hitGrid[idx + 0];
  var g = this._hitGrid[idx + 1];
  var b = this._hitGrid[idx + 2];
  var id = ShaderLayer.RGB2Int(r, g, b);
  if (id) {
    return id - 1;
  }
  return null;

};
