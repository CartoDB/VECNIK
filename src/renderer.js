//========================================
// vecnik views
//========================================

// TODO: do we want a render loop, or rendering on demand, or loop+throttling

(function(VECNIK) {

  VECNIK.Renderer = function(options) {
    options = options || {};
    if (!options.shader) {
      throw new Error('Shader instance is needed to create a renderer');
    }
    this._shaders = options.shader.length ? options.shader : [options.shader];
  };

  VECNIK.Renderer.POINT_RADIUS = 2;

  var proto = VECNIK.Renderer.prototype;

  proto.setCanvas = function(canvas) {
    var context = this._context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.mozImageSmoothingEnabled = false;
    context.webkitImageSmoothingEnabled = false;

    for (var i = 0, il = this._shaders.length; i < il; i++) {
      this._shaders[i].setContext(context);
    }
  };

  proto._drawPolyline = function(coordinates) {
    var origin = this._origin;
    var context = this._context, i, il;
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

  proto._drawCircle = function(c, radius) {
    var origin = this._origin;
    this._context.arc(c.x-origin.x, c.y-origin.y, radius, 0, Math.PI*2);
  };

  proto.render = function(queue, origin) {
    this._origin = origin;

    var
      context = this._context,
      shaders = this._shaders,
      shaderPass,
      i, il, j, jl, s, sl,
      feature, coordinates;

    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    for (s = 0, sl = shaders.length; s < sl; s++) {
      shaderPass = shaders[s];

      for (i = 0, il = queue.length; i < il; i++) {
        feature = queue[i];

        if (shaderPass) {
          // TODO: return here if the style has changed to close previous polygons or not
          shaderPass.apply(feature.properties);
        }

        context.beginPath();

        coordinates = feature.coordinates;

        // TODO: missing a few geometry types
        switch (feature.type) {
          case 'Point':
            this._drawCircle(coordinates, VECNIK.Renderer.POINT_RADIUS);
          break;

          case 'MultiPoint':
            for (j = 0, jl = coordinates.length; j < jl; j++) {
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
    }
  };

})(VECNIK);
