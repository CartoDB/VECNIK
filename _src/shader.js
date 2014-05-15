//========================================
// shader
//========================================

vecnik.shader = function(sh) {

  var mapper = {
      'point-color': 'fillStyle',
      'line-color': 'strokeStyle',
      'line-width': 'lineWidth',
      'line-opacity': 'globalAlpha',
      'polygon-fill': 'fillStyle',
      'polygon-opacity': 'globalAlpha'
  };


  var compiled = {};
  var _shader_src = null;

  function _shader(canvas_ctx, data, render_context) {
    _shader.apply(canvas_ctx, data, render_context);
  }

  //extend(_shader, vecnik.Event);


  _shader.compile = function(shader) {
      if(typeof shader === 'string') {
          shader = eval("(function() { return " + shader +"; })()");
      }
      _shader_src = shader;
      for(var attr in shader) {
        var c = mapper[attr];
        if(c) {
          compiled[c] = eval("(function() { return shader[attr]; })();");
        }
      }

      //_shader.emit('compiled');
      return _shader;
  };

  var needed_settings = {
    'LineString': [ 
      'line-color', 
      'line-width',
      'line-opacity'
    ],
    'Polygon': [ 
      'polygon-fill',
      'line-width'
    ],
    'MultiPolygon': [ 
      'polygon-fill'
    ]
  };
  var defaults = {
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

  _shader.needs_render = function(data, render_context, primitive_type) {
    var variables = needed_settings[primitive_type];
    var shader = compiled;
    for(var attr in variables) {
      var style_attr = variables[attr];
      var attr_present = _shader_src[style_attr];
      if(attr_present !== undefined) {
        var fn = shader[mapper[style_attr]];
        if(typeof fn === 'function') {
          fn = fn(data, render_context);
        } 
        if(fn !== null && fn !== undefined) {
          return true;
        }
      } 
    }
    return false;
  }

  _shader.reset = function(ctx, primitive_type) {
    var def = defaults[primitive_type];
    for(var attr in def) {
      ctx[attr] = def[attr];
    }
  }

  _shader.apply = function(canvas_ctx, data, render_context) {
    var shader = compiled;
    for(var attr in shader) {
        var fn = shader[attr];
        if(typeof fn === 'function') {
          fn = fn(data, render_context);
        } 
        if(fn !== null && canvas_ctx[attr] != fn) {
          canvas_ctx[attr] = fn;
        }
    }
  };

  _shader.stroke = function() {
      return _shader_src['line-width'] != undefined;
  }
  
  _shader.fill = function() {
      return _shader_src['polygon-fill'] != undefined;
  }

  _shader.compile(sh)

  return _shader;

}
