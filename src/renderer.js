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
    context.moveTo(coordinates[0].x, coordinates[0].y);
    for (var i = 1, il = coordinates.length; i < il; i++) {
      context.lineTo(coordinates[i].x, coordinates[i].y);
    }
  };

  proto._drawPolygon = function(context, coordinates) {
    for (var i = 0, il = coordinates.length; i < il; i++) {
      this._drawPolyline(context, coordinates[i]);
    }
  };

  proto._drawCircle = function(context, center, radius) {
    context.arc(center.x, center.y, radius, 0, Math.PI*2);
  };

  proto.render = function(context, collection) {
    var
      shaders = this._shaders,
      shaderPass,
      i, il, j, jl, s, sl,
      feature, coordinates;

    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    for (s = 0, sl = shaders.length; s < sl; s++) {
      shaderPass = shaders[s];

      for (i = 0, il = collection.length; i < il; i++) {
        feature = collection[i];

        if (shaderPass) {
          // TODO: stroke/fill here if the style has changed to close previous polygons
          shaderPass.apply(context, feature.properties);
        }

        coordinates = feature.coordinates;

        context.beginPath();

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
