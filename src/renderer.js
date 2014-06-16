//========================================
// vecnik views
//========================================

// TODO: do we want a render loop, or rendering on demand, or loop+throttling

(function(VECNIK) {

  VECNIK.Renderer = function(options) {
    options = options || {};
    if (!options.shader) {
      throw new Error('VECNIK.Renderer requires a shader');
    }
    this._shaders = options.shader.length ? options.shader : [options.shader];
  };

  VECNIK.Renderer.POINT_RADIUS = 2;

  var proto = VECNIK.Renderer.prototype;

  proto._drawPolyline = function(context, coordinates) {
    var origin = this._origin;
    context.moveTo(coordinates[0].x-origin.x, coordinates[0].y-origin.y);
    for (var i = 1, il = coordinates.length; i < il; i++) {
      context.lineTo(coordinates[i].x-origin.x, coordinates[i].y-origin.y);
    }
  };

  proto._drawPolygon = function(context, coordinates) {
    for (var i = 0, il = coordinates.length; i < il; i++) {
      this._drawPolyline(context, coordinates[i]);
    }
  };

  proto._drawCircle = function(context, c, radius) {
    var origin = this._origin;
    context.arc(c.x-origin.x, c.y-origin.y, radius, 0, Math.PI*2);
  };

  proto.render = function(context, collection, origin) {
    this._origin = origin;

    var
      shaders = this._shaders,
      shaderPass,
      i, il, j, jl, s, sl,
      feature, coordinates;

    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

context.fillStyle = 'rgba(240,220,200,0.5)';
context.fillRect(0, 0, context.canvas.width, context.canvas.height);

    for (s = 0, sl = shaders.length; s < sl; s++) {
      shaderPass = shaders[s];

      for (i = 0, il = collection.length; i < il; i++) {
        feature = collection[i];

        if (shaderPass) {
          // TODO: return here if the style has changed to close previous polygons or not
          shaderPass.apply(context, feature.properties);
        }

        context.beginPath();

        coordinates = feature.coordinates;

        // TODO: missing a few geometry types
        switch (feature.type) {
          case 'Point':
            this._drawCircle(context, coordinates, VECNIK.Renderer.POINT_RADIUS);
          break;

          case 'MultiPoint':
            for (j = 0, jl = coordinates.length; j < jl; j++) {
              this._drawCircle(context, coordinates[j], VECNIK.Renderer.POINT_RADIUS);
            }
          break;

          case 'Polygon':
            this._drawPolygon(context, coordinates);
            context.closePath();
          break;

          case 'MultiPolygon':
            for (j = 0, jl = coordinates.length; j < jl; j++) {
              this._drawPolygon(context, coordinates[j]);
            }
            context.closePath();
          break;

          case 'LineString':
            this._drawPolyline(context, coordinates);
          break;
        }

        context.stroke();
        context.fill(); // TODO: skip fill for LineString
      }
    }
  };

})(VECNIK);
