

function dragger(el) {

    var self = this;
    var dragging = false;
    var x, y;

    el.ontouchstart = el.onmousedown = function(e) {
        dragging = true;
        if (e.touches) {
            var p = e.touches[0];
            x = p.pageX;
            y = p.pageY;
        } else {
            x = e.clientX;
            y = e.clientY;
        }
        self.emit('startdrag', x, y);
    };

    el.ontouchmove = el.onmousemove = function(e) {
        var xx, yy;
        if(!dragging) return;
        if (e.touches) {
            var p = e.touches[0];
            xx = p.pageX;
            yy = p.pageY;
        } else {
            xx = e.clientX;
            yy = e.clientY;
        }
        self.emit('move', xx - x, yy - y);
        return false;
    };

    el.ontouchend = el.onmouseup = function(e) {
        dragging = false;
    };
}

dragger.prototype = new vecnik.Events();

vecnik.layer = function(size) {
  var canvas = this.canvas = document.createElement('canvas');
  canvas.style.padding = '0';
  canvas.style.margin= '0';
  canvas.style.position = 'absolute';
  canvas.width = size.x;
  canvas.height = size.y;
  canvas.style.top = 0;
  canvas.style.left = 0;

  var ctx = canvas.getContext( '2d' );

  var _renderer = vecnik.renderer(ctx);

  var translate = {x: 0, y: 0};
  var scale = {x: 1, y: 1};

  function layer() { }

  layer.canvas = function() {
    return canvas;
  }

  layer.renderer = function(r) {
    if(!arguments.length) return _renderer;
    _renderer = r;
    return layer;
  }

  layer.translate = function(x, y) {
    translate.x = x;
    translate.y = y;
    return layer;
  }

  layer.scale = function(sx, sy) {
    scale.x = sx;
    scale.y = sy;
  }

  layer.clear = function() {
    canvas.width = canvas.width;
  }

  layer.render = function() {
    layer.clear();
    ctx.translate(size.x>>1, size.y>>1);
    //ctx.scale(scale.x, scale.y);
    //ctx.translate(translate.x, translate.y);
    this.each(function(geo) {
      var m = geo.matrix();
      m.scale(scale.x, scale.y)
        .translate(translate.x, translate.y);
      geo.matrix(m);
      _renderer(geo);
    });
    /*
    this.each(function() {
    });
    ctx.fillRect(-30, -30, 60, 60);
    */
  }

  extend(layer, vecnik.Tree);
  return layer;

}

vecnik.map = function(_el) {

  var layers = [];
  var center = { x: 0, y: 0};
  var zoom = target_zoom = 1;
  var el = document.createElement('div');
  var width = _el.offsetWidth >> 0;
  var height = _el.offsetHeight >> 0;

  _el.appendChild(el);
  el.style.padding = '0';
  el.style.margin= '0';
  el.style.position = 'relative';
  el.style.width = width + "px";
  el.style.height = height + "px";
  el.style.top = 0;
  el.style.left = 0;

  function map() {}
  extend(map, vecnik.Tree);
  
  var drag_init = {x:0, y:0};
  var target_center = {x: 0, y: 0};
  var drag = new dragger(el);
  drag.on('startdrag', function() {
    drag_init.x = center.x;
    drag_init.y = center.y;
  });

  el.ondblclick = function(e) {
    map.zoom(zoom + 1);
    if (e.touches) {
        var p = e.touches[0];
        x = p.pageX;
        y = p.pageY;
    } else {
      var s = 1.0/Math.pow(2, zoom);
      target_center.x = -s*(e.clientX - (width/2))  + center.x;
      target_center.y = -s*(e.clientY - (height/2)) + center.y;
    }
    vecnik.timer(map);
  }

  el.onmousewheel = function(e) {
    if(e.wheelDeltaY > 0) {
      map.zoom(map.zoom() + 0.3);
    } else {
      map.zoom(map.zoom() - 0.3);
    }
  }

  drag.on('move', function(dx, dy) {
      var s = 1.0/Math.pow(2, zoom);
      target_center.x = drag_init.x + dx*s;
      target_center.y = drag_init.y + dy*s;
      vecnik.timer(map);
  });

  map.transform = function(tr) {
    transform = tr;
    return map;
  }

  map.size = function() {
    return { x: width, y: height};
  }

  map.zoom = function(z) {
    if(!arguments.length) return zoom;
    target_zoom = z;
    vecnik.timer(map);
    return map;
  }

  map.addLayer = function(layer) {
    el.appendChild(layer.canvas());
    layers.push(layer);
    map.add(layer);
  }

  map.update = function(dt) {
      var c = center;
      var t = target_center;
      var dx = t.x - c.x;
      var dy = t.y - c.y;
      c.x += dx*0.1;
      c.y += dy*0.1;

      zoom += (target_zoom - zoom) * 0.01 * dt;
      
      this.each(function(layer) {
        layer.translate(c.x, c.y);
        var s = Math.pow(2, zoom);
        layer.scale(s, s);
      })
      map.render();

      return Math.abs(dx) + Math.abs(dy) > 0.001 ||
             Math.abs(target_zoom - zoom) > 0.1;
  }

  map.render = function() {
    this.each(function(layer) {
      layer.render();
    })
  }

  return map;
}
