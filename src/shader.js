
//========================================
// shader
//========================================

var VECNIK = VECNIK || {};

(function(VECNIK) {

  // properties needed for each geometry type to be renderered
  var requiredProperties = {
    point: [
      'marker-width'
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
  var currentContextStyle = {};

  var propertyMapping = {
    'point-color': 'fillStyle',
    'line-color': 'strokeStyle',
    'line-width': 'lineWidth',
    'line-opacity': 'globalAlpha',
    'polygon-fill': 'fillStyle',
    'polygon-opacity': 'globalAlpha'
  };

  VECNIK.CartoShader = function(style) {
    this.update(style);
  };

  var proto = VECNIK.CartoShader.prototype;

  proto.update = function(style) {
    this._layers = [];
    var shader = new carto.RendererJS().render(style);

    if (shader && shader.layers) {
      for (var i = 0, il = shader.layers.length; i < il; i++) {
        this._layers[i] = new VECNIK.CartoShader.Layer(shader.getLayers()[i].getShader());
      }
    }
  };

  proto.getLayers = function() {
    return this._layers;
  };

  //***************************************************************************

  VECNIK.CartoShader.Layer = function(shader) {
    VECNIK.Events.prototype.constructor.call(this);
    this._compiled = {};
    this.compile(shader);
  };

  var proto = VECNIK.CartoShader.Layer.prototype = new VECNIK.Events();

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
      currentContextStyle[context] = currentStyle = currentContextStyle[context] || {};
      if (currentStyle[prop] !== val) {
        context[prop] = currentStyle[prop] = val;
        changed = true;
      }
    }
    return changed;
  };

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

})(VECNIK);

if (typeof module !== 'undefined' && module.exports) {
  module.exports.CartoShader = CartoShader;
}
