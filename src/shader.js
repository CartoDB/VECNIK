
//========================================
// shader
//========================================

var VECNIK = VECNIK || {};

(function(VECNIK) {

  // properties needed for each geometry type to be renderered
  var rendererNeededProperties = {
    'point': [ 
      'marker-width'
    ],
    'linestring': [ 
      'line-color', 
    ],
    'polygon': [ 
      'polygon-fill',
      'line-color', 
    ]
  };

  // last context style applied, this is a shared variable
  // for all the shaders
  var lastContextStyle = {};

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

  // given feature properties and map rendering content returns
  // the style to apply to canvas context
  // TODO: optimize this to not evaluate when featureProperties does not
  // contain values involved in the shader
  proto.evalStyle = function(featureProperties, zoom) {
    var style = {}, shader = this._compiled;
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
      style[prop] = val;
    }
    return style;
  },

  proto.apply = function(context, featureProperties, zoom) {
    var
      shader = this._compiled,
      val, prevStyle;
    var changed = false;
    var style = this.evalStyle(featureProperties, zoom);
    var props = Object.keys(style);
    for (var i = 0, len = props.length; i < len; ++i) {
      var prop = props[i];
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
      prevStyle = lastContextStyle[context] = lastContextStyle[context] || {};
      if (prevStyle[prop] !== val) {
        context[prop] = prevStyle[prop] = val;
        changed = true;
      }
    }
    return changed;
  };


  // return true if the feature need to be rendered
  proto.needsRender = function(geometryType, featureProperties, zoom) {
    var style = null;
    // check properties in the shader first
    var props = rendererNeededProperties[geometryType.toLowerCase()];
    for (var i = 0; i < props.length; ++i) {
      var prop = props[i];
      if (this._shaderSrc[prop]) {
        // eval it to know if the property is active for the feature properties
        style = style || this.evalStyle(featureProperties, zoom);
        if (style[propertyMapping[prop]]) {
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
