
var Shader = require('./shader');
var Events = require('./core/events');

var propertyMapping = {
  'marker-width': 'markerSize',
  'marker-fill': 'markerFill',
  'marker-line-color': 'markerStrokeStyle',
  'marker-line-width': 'markerLineWidth',
  'marker-color': 'markerFill',
  'point-color': 'markerFill',
  'marker-opacity': 'markerAlpha', // does that exist?

  'line-color': 'strokeStyle',
  'line-width': 'lineWidth',
  'line-opacity': 'lineAlpha',

  'polygon-fill': 'polygonFill',
  'polygon-opacity': 'polygonAlpha',

  'text-face-name': 'fontFace',
  'text-size': 'fontSize',
  'text-fill': 'textFill',
  'text-opacity': 'textAlpha',
  'text-halo-fill': 'textStrokeStyle',
  'text-halo-radius': 'textLineWidth',
  'text-align': 'textAlign',
  'text-name': 'textContent'
};

var ShaderLayer = module.exports = function(shader, shadingOrder) {
  Events.prototype.constructor.call(this);
  this._compiled = {};
  this._shadingOrder = shadingOrder || [
    Shader.POINT,
    Shader.POLYGON,
    Shader.LINE,
    Shader.TEXT
  ];
  this.compile(shader);
};

var proto = ShaderLayer.prototype = new Events();

proto.clone = function() {
  return new ShaderLayer(this._shaderSrc, this._shadingOrder);
};

proto.compile = function(shader) {
  this._shaderSrc = shader;
  if (typeof shader === 'string') {
    shader = function() {
      return shader;
    };
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
proto.getStyle = function(featureProperties, mapContext) {
  mapContext = mapContext || {};
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
},

proto.getShadingOrder = function() {
  return this._shadingOrder;
};

/**
 * return a shader clone ready for hit test.
 * @keyAttribute: string with the attribute used as key (usually the feature id)
 */
proto.createHitShaderLayer = function(key) {
  var hit = this.clone();
  // replace all kind of fill and stroke props to use a custom color
  // TODO: review properties used
  for (var k in hit._compiled) {
    if (k === 'polygonFill' || k === 'strokeStyle') {
      hit._compiled[k] = function(featureProperties, mapContext) {
        return 'rgb(' + Int2RGB(featureProperties[key] + 1).join(',') + ')';
      };
    }
  }
  return hit;
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
