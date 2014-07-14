
var ShaderLayer = require('./shader.layer');

function createCanvas() {
  var
    canvas = document.createElement('CANVAS'),
    context = canvas.getContext('2d');

  canvas.width  = Tile.SIZE;
  canvas.height = Tile.SIZE;
  context.mozImageSmoothingEnabled = false;
  context.webkitImageSmoothingEnabled = false;

  // TODO: allow these to be handled in Renderer / CartoCSS
  context.lineCap = 'round';
  context.lineJoin = 'round';

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
