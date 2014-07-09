
var Geometry = require('./geometry');
var ShaderLayer = require('./shader.layer');

var Shader = module.exports = function(style) {
  this._layers = [];
  if (style) {
    this.update(style);
  }
};

var proto = Shader.prototype;

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
  var
    shader = new carto.RendererJS().render(style),
    layer, renderOrder, layerShader, sh, p,
    geometryTypeMapping = {
      line: Geometry.LINE,
      polygon: Geometry.POLYGON,
      markers: Geometry.POINT
    };

  if (shader && shader.layers) {
    for (var i = 0, il = shader.layers.length; i < il; i++) {
      layer = shader.layers[i];

      // order from cartocss
      renderOrder = layer.getSymbolizers().map(function(s) {
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

      this._layers[i] = new ShaderLayer(sh, renderOrder);
    }
  }
};

proto.getLayers = function() {
  return this._layers;
};
