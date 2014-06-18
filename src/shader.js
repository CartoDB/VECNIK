
//========================================
// shader
//========================================

var VECNIK = VECNIK || {};

(function(VECNIK) {

  var propertyMapping = {
    'point-color': 'fillStyle',
    'line-color': 'strokeStyle',
    'line-width': 'lineWidth',
    'line-opacity': 'globalAlpha',
    'polygon-fill': 'fillStyle',
    'polygon-opacity': 'globalAlpha'
  };

  var defaults = {
    strokeStyle: '#000000',
    lineWidth: 1,
    globalAlpha: 1.0,
    lineCap: 'round'
  };

  VECNIK.CartoShader = function(shader) {
    VECNIK.Events.prototype.constructor.call(this);
    this._compiled = {};
    this.compile(shader);
  };

  // TODO: enable the class to handle layers
  VECNIK.CartoShader.create = function(style) {
    var
      shader = new carto.RendererJS().render(style),
      layers = [];
    for (var i = 0, il = shader.layers.length; i < il; i++) {
      layers[i] = new VECNIK.CartoShader(shader.getLayers()[i].getShader());
    }
    return layers;
  };

  var proto = VECNIK.CartoShader.prototype = new VECNIK.Events();

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

  proto.apply = function(context, featureProperties, zoom) {
    var
      shader = this._compiled,
      val;
    var changed = false;
    // https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#5-for-in
    var props = Object.keys(shader);
    for (var i = 0, len = props.length; i < len; ++i) {
      var prop = props[i];
      val = shader[prop];
      if (typeof val === 'function') {
        val = val(featureProperties, { zoom: zoom });
      }
      if (val === null) {
        val = defaults[prop];
      }
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

      var prevStyle = context._vecnik_style = context._vecnik_style || {};
      if (prevStyle[prop] !== val) {
        context[prop] = prevStyle[prop] = val;
        changed = true;
      }
    }
    return changed;
  };

})(VECNIK);

if (typeof module !== 'undefined' && module.exports) {
  module.exports.CartoShader = CartoShader;
}
