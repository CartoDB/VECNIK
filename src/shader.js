
//========================================
// shader
//========================================

(function(VECNIK) {

  var propertyMapping = {
    'point-color': 'fillStyle',
    'line-color': 'strokeStyle',
    'line-width': 'lineWidth',
    'line-opacity': 'globalAlpha',
    'polygon-fill': 'fillStyle',
    'polygon-opacity': 'globalAlpha'
  };

  var requiredProperties = {
    'LineString': [
      'line-color',
      'line-width',
      'line-opacity'
    ],
    'Polygon': [
      'polygon-fill'
    ],
    'MultiPolygon': [
      'polygon-fill'
    ]
  };

  var defaultProperties = {
    'LineString': {
      'strokeStyle': '#000',
      'lineWidth': 1,
      'globalAlpha': 1.0,
      'lineCap': 'round'
    },
    'Polygon': {
      'strokeStyle': '#000',
      'lineWidth': 1,
      'globalAlpha': 1.0
    },
    'MultiPolygon': {
      'strokeStyle': '#000',
      'lineWidth': 1,
      'globalAlpha': 1.0
    }
  };

  VECNIK.CartoShader = function(shader) {
    VECNIK.Events.prototype.constructor.call(this);
    this.compiled = {};
    this.compile(shader);
  }

  var proto = VECNIK.CartoShader.prototype = new VECNIK.Events();

  proto.compile = function(shader) {
    this.shaderSrc = shader;
    if (typeof shader === 'string') {
      shader = eval("(function() { return " + shader +"; })()");
    }
    var property;
    for (var attr in shader) {
      if (property = propertyMapping[attr]) {
        this.compiled[property] = eval("(function() { return shader[attr]; })();");
      }
    }

    this.emit('change');
  };

  proto.isDirty = function(data, context, primitiveType) {
    var variables = requiredProperties[primitiveType];
    var shader = this.compiled;
    for (var attr in variables) {
      var style_attr = variables[attr];
      var attr_present = this.shaderSrc[style_attr];
      if (attr_present !== undefined) {
        var fn = shader[propertyMapping[style_attr]];
        if (typeof fn === 'function') {
          fn = fn(data, context);
        }
        if (fn !== null && fn !== undefined) {
          return true;
        }
      }
    }
    return false;
  };

  proto.reset = function(ctx, primitiveType) {
    var def = defaultProperties[primitiveType];
    for (var attr in def) {
      ctx[attr] = def[attr];
    }
  };

  proto.apply = function(canvas_ctx, data, context) {
    var shader = this.compiled;
    for (var attr in shader) {
      var fn = shader[attr];
      if (typeof fn === 'function') {
        fn = fn(data, context);
      }
      if (fn !== null && canvas_ctx[attr] != fn) {
        canvas_ctx[attr] = fn;
      }
    }
  };

})(VECNIK);

if (typeof module !== 'undefined' && module.exports) {
  module.exports.CartoShader = CartoShader;
}
