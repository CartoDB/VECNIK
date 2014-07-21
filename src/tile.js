
var ShaderLayer = require('./shader.layer');
var Canvas = require('./canvas');

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
  this._renderer.render(this, this._canvas, this._data, {
    zoom: this._coords.z
  });
};

/**
 * return hit grid
 */
proto._renderHitGrid = function() {
  // store current shader and use hitShader for rendering the grid
  var currentShader = this._renderer.getShader();
  this._renderer.setShader(currentShader.createHitShader('cartodb_id'));
//  this._renderer.setShader(currentShader.createHitShader('id')); // make OSM work
  this._renderer.render(this, this._hitCanvas, this._data, {
    zoom: this._coords.z
  });

  // restore shader
  this._renderer.setShader(currentShader);
  return this._hitCanvas.getData();
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
