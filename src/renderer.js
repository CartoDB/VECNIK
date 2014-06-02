//========================================
// vecnik views
//========================================

// TODO: do we want a render loop, or rendering on demand, or loop+throttling

(function(VECNIK) {

  VECNIK.Renderer = function() {};

  VECNIK.Renderer.POINT_RADIUS = 2;

  var proto = VECNIK.Renderer.prototype;

  proto.setCanvas = function(canvas) {
    var context = this._context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.mozImageSmoothingEnabled = false;
    context.webkitImageSmoothingEnabled = false;
  };

  proto._drawPolyline = function(coordinates) {
    var origin = this._origin;
    var context = this._context, i, il;
//    context.moveTo(coordinates[0]-origin.x, coordinates[1]-origin.y);
//    for (i = 2, il = coordinates.length-1; i < il; i += 2) {
//      context.lineTo(coordinates[i]-origin.x, coordinates[i+1]-origin.y);
//    }
    context.moveTo(coordinates[0].x-origin.x, coordinates[0].y-origin.y);
    for (i = 1, il = coordinates.length; i < il; i++) {
      context.lineTo(coordinates[i].x-origin.x, coordinates[i].y-origin.y);
    }
  };

  proto._drawPolygon = function(coordinates) {
    for (var i = 0, il = coordinates.length; i < il; i++) {
      this._drawPolyline(coordinates[i]);
    }
  };

//  proto._drawCircle = function(x, y, radius) {
  proto._drawCircle = function(c, radius) {
    var origin = this._origin;
//    this._context.arc(x-origin.x, y-origin.y, radius, 0, Math.PI*2);
    this._context.arc(c.x-origin.x, c.y-origin.y, radius, 0, Math.PI*2);
  };

//  proto.render = function(ctx, geometry, zoom, shader) {
//    for (var i = 0; i < geometry.length; ++i) {
//      var render_context = {
//        zoom: zoom,
//        id: i
//      };
//      var isActive = true;
//      if (shader) {
//        is_active = shader.needs_render(geo.properties, render_context, geo.type);
//        if (isActive) {
//          shader.reset(ctx, geo.type);
//          shader.apply(ctx, geo.properties, render_context);
//        }
//      }
//      if (isActive) {
//        renderer(ctx, geo.coordinates);
//      }
//    }
//  };

  proto.render = function(queue, origin) {
    this._origin = origin;

    var
      context = this._context,
      i, il, j, jl,
      feature, coordinates;

    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
context.strokeStyle = '#ffcc00';
context.fillStyle   = 'rgba(100,150,100,0.5)';

    for (i = 0, il = queue.length; i < il; i++) {
      feature = queue[i];
      coordinates = feature.coordinates;

  //  context.strokeStyle = feature.strokeColor;
  //  context.fillStyle   = feature.fillColor;

      context.beginPath();

      // TODO: missing a few geometry types
      switch (feature.type) {
        case 'Point':
//          this._drawCircle(coordinates[0], coordinates[1], VECNIK.Renderer.POINT_RADIUS);
          this._drawCircle(coordinates, VECNIK.Renderer.POINT_RADIUS);
        break;

        case 'MultiPoint':
          context.beginPath();
          for (j = 0, jl = coordinates.length; j < jl; j++) {
//            this._drawCircle(coordinates[j][0], coordinates[j][1], VECNIK.Renderer.POINT_RADIUS);
            this._drawCircle(coordinates[j], VECNIK.Renderer.POINT_RADIUS);
          }
        break;

        case 'Polygon':
          this._drawPolygon(coordinates);
          context.closePath();
        break;

        case 'MultiPolygon':
          for (j = 0, jl = coordinates.length; j < jl; j++) {
            this._drawPolygon(coordinates[j]);
          }
          context.closePath();
        break;

        case 'LineString':
          this._drawPolyline(coordinates);
        break;
      }

      context.stroke();
      context.fill(); // TODO: skip fill for LineString
    }
  };

})(VECNIK);
