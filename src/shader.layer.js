
var Geometry = require('./geometry');
var Events = require('./core/events');


// properties needed for each geometry type to be renderered
var requiredProperties = {
  point: [
    'marker-width',
    'line-color'
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
// could be shared across shader layersm but not urgently
var currentContextStyle = {};

var propertyMapping = {
  'marker-width': 'marker-width',
  'marker-fill': 'fillStyle',
  'marker-line-color': 'strokeStyle',
  'marker-line-width': 'lineWidth',
  'marker-color': 'fillStyle',
  'point-color': 'fillStyle',
  'line-color': 'strokeStyle',
  'line-width': 'lineWidth',
  'line-opacity': 'globalAlpha',
  'polygon-fill': 'fillStyle',
  'polygon-opacity': 'globalAlpha'
};

var ShaderLayer = module.exports = function(shader, renderOrder) {
  Events.prototype.constructor.call(this);
  this._compiled = {};
  this._renderOrder = renderOrder || [
    Geometry.POINT,
    Geometry.POLYGON,
    Geometry.LINE
  ];
  this.compile(shader);
};

var proto = ShaderLayer.prototype = new Events();

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

    var id = context._shId;
    if (!id) {
      id = context._shId = Object.keys(currentContextStyle).length + 1;
      currentContextStyle[id] = {};
    }
    currentStyle = currentContextStyle[id];
    if (currentStyle[prop] !== val) {
      context[prop] = currentStyle[prop] = val;
      changed = true;
    }
  }
  return changed;
};

proto.renderOrder = function() {
  return this._renderOrder;
},

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
