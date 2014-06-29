
var Geometry = require('./geometry');
var ShaderLayer = require('./shader.layer');

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
