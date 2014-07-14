
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
    var ShaderLayer = require('./shader.layer');

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
