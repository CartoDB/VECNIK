
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
proto.createHitShader = function() {
  var hitShader = new Shader();
  for (var i = 0; i < this._layers.length; i++) {
    hitShader._layers.push(this._layers[i].createHitShaderLayer());
  }
  return hitShader;
};

proto.update = function(style) {
  var shader = new carto.RendererJS().render(style);

  if (!shader || !shader.layers) {
    return;
  }

  // requiring this late in order to avoid circular reference shader <-> shader.layer
  var CartoShader = require('./cartoshader');

  var shaderLayer;
  for (var i = 0, il = shader.layers.length; i < il; i++) {
    shaderLayer = shader.layers[i];
    this._layers[i] = new CartoShader(
      shaderLayer.fullName(),
      this._cloneProperties(shaderLayer.getShader()),
      shaderLayer.getSymbolizers()
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
