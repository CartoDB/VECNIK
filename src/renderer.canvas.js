
vecnik.renderer = function(ctx) {

  var _ctx = ctx;
  var _shader;

  function render(geo) {
    _render(geo);
  }

  var self = render;

  var _primitive_render = {

    Point: function(x, y) {
      _ctx.save();
      var radius = 2;
      _ctx.translate(x, y);
      _ctx.beginPath();
      _ctx.arc(radius, radius, radius, 0, Math.PI * 2, true);
      _ctx.closePath();
      _ctx.fill();
      _ctx.stroke();
      _ctx.restore();
    },

    MultiPoint: function(x, y) {
      var prender = _primitive_render.Point;
      for(var i = 0, len = x.length; i < len; ++i) {
          prender(x[i], y[i]);
      }
    },

    Polygon: function(x, y) {
      _ctx.beginPath();
      _ctx.moveTo(x[0], y[0]);
      for(var i = 0, len = x.length; i < len; ++i) {
        _ctx.lineTo(x[i], y[i]);
      }
      _ctx.closePath();
      _ctx.fill();
    },

    LineString: function(x, y) {
      _ctx.beginPath();
      _ctx.moveTo(x[0], y[0]);
      for(var i = 0, len = x.length; i < len; ++i) {
        _ctx.lineTo(x[i], y[i]);
      }
      _ctx.stroke();
    }
  };

  render.primitiveRender = function(r) {
    if(!arguments.length) return _primitive_render;
    _primitive_render = r;
    return render;
  }

  render.shader = function(shader) {
    _shader = shader;
  }

  function _render(geo) {
    var primitive_type;
    if(!geo.children().length) {
      var primitive_type = geo.type();
      var renderer = _primitive_render[primitive_type];
      if(renderer) {
          var is_active = true;
          /*if(_shader) {
            is_active = _shader.needs_render(geo.metadata(), render_context, primitive_type);
            if(is_active) {
              _shader.reset(ctx, primitive_type);
              _shader.apply(ctx, geo.metadata, render_context);
            }
          }*/
          if (is_active) {
            renderer(geo.x(), geo.y());
          }
      }
    } else {
      geo.each(_render);
    }
  };

  return render;

}
