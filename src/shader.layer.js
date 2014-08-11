
var Events = require('./core/events');
var Shader = require('./shader');

// https://www.mapbox.com/carto/api/2.3.0/

var propertyMapping = {
  'marker-width': 'markerSize',
  'marker-fill': 'markerFill',
  'marker-line-color': 'markerLineColor',
  'marker-line-width': 'markerLineWidth',
  'marker-color': 'markerFill',
  'marker-opacity': 'markerAlpha', // does that exist?
  'marker-allow-overlap': 'markerAllowOverlap',

  'line-color': 'lineColor',
  'line-width': 'lineWidth',
  'line-opacity': 'lineAlpha',
  'polygon-fill': 'polygonFill',
  'polygon-opacity': 'polygonAlpha',

  'text-face-name': 'fontFace',
  'text-size': 'fontSize',
  'text-fill': 'textFill',
  'text-opacity': 'textAlpha',
  'text-halo-fill': 'textOutlineColor',
  'text-halo-radius': 'textOutlineWidth',
  'text-align': 'textAlign',
  'text-name': 'textContent',
  'text-allow-overlap': 'textAllowOverlap'
};

var hitShaderProperties = [
  'markerFill',
  'markerLineColor',
  'lineColor',
  'polygonFill',
  'textFill',
  'textOutlineColor'
];

var ShaderLayer = module.exports = function(name, shaderSrc, shadingOrder) {
  Events.prototype.constructor.call(this);

  this._name = name || '';

  this._compiled = {};
  this.compile(shaderSrc);

  this._shadingOrder = shadingOrder || [
    Shader.POINT,
    Shader.POLYGON,
    Shader.LINE,
    Shader.TEXT
  ];
};

var proto = ShaderLayer.prototype = new Events();

proto.clone = function() {
  return new ShaderLayer(this._name, this._shaderSrc, this._shadingOrder);
};

proto.compile = function(shaderSrc) {
  this._shaderSrc = shaderSrc;
  if (typeof shaderSrc === 'string') {
    shaderSrc = function() {
      return shaderSrc;
    };
  }
  var property;
  for (var attr in shaderSrc) {
    if (property = propertyMapping[attr]) {
      this._compiled[property] = shaderSrc[attr];
    }
  }
  this.emit('change');
};

// given feature properties and map rendering content returns
// the style to apply to canvas context
// TODO: optimize this to not evaluate when featureProperties do not
// contain values involved in the shader
// TODO: hover / click should just complement existing properties
proto.getStyle = function(featureProperties, mapContext) {
  mapContext = mapContext || {};

  var nameAttachment = typeof this._name === 'string' ? this._name.split('::')[1] : '';

  if (nameAttachment === 'hover' &&
     (!mapContext.hovered || mapContext.hovered.cartodb_id !== featureProperties.cartodb_id)) {
    return {};
  }
  if (nameAttachment === 'click' &&
     (!mapContext.clicked || mapContext.clicked.cartodb_id !== featureProperties.cartodb_id)) {
    return {};
  }

  var
    style = {},
    compiled = this._compiled,
    // https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#5-for-in
    props = Object.keys(compiled),
    prop, val;

  for (var i = 0, len = props.length; i < len; ++i) {
    prop = props[i];
    val = compiled[prop];

    if (typeof val === 'function') {
      val = val(featureProperties, mapContext);
    }
    style[prop] = val;
  }

  return style;
};

proto.getShadingOrder = function() {
  return this._shadingOrder;
};

/**
 * return a shader clone ready for hit test.
 */
proto.createHitShaderLayer = function() {
  var hitLayer = this.clone();
  for (var prop in hitLayer._compiled) {
    if (~hitShaderProperties.indexOf(prop)) {
      hitLayer._compiled[prop] = function(featureProperties, mapContext) {
        return 'rgb(' + Int2RGB(featureProperties.cartodb_id + 1).join(',') + ')';
      };
    }
  }

  // clone symbolizers and skip texts in hit layer
  hitLayer._shadingOrder = [];
  for (var i = 0, il = this._shadingOrder.length; i < il; i++) {
    if (this._shadingOrder[i] !== 'text') {
      hitLayer._shadingOrder.push(this._shadingOrder[i]);
    }
  }
  return hitLayer;
};

var RGB2Int = function(r, g, b) {
  return r | (g<<8) | (b<<16);
};

var Int2RGB = function(input) {
  var r = input & 0xff;
  var g = (input >> 8) & 0xff;
  var b = (input >> 16) & 0xff;
  return [r, g, b];
};

// TODO: could be static methods of VECNIK.Shader
ShaderLayer.RGB2Int = RGB2Int;
ShaderLayer.Int2RGB = Int2RGB;
