//========================================
// vecnik views
//========================================

// TODO: do we want a render loop, or rendering on demand, or loop+throttling

var VECNIK = VECNIK || {};

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

  proto._drawLineString = function(context, coordinates) {
    context.moveTo(coordinates[0], coordinates[1]);
    for (var i = 2, il = coordinates.length-2; i < il; i+=2) {
      context.lineTo(coordinates[i], coordinates[i+1]);
    }
  };

  // render the specified collection in the contenxt
  // mapContext contains the data needed for rendering related to the
  // map state, for the moment only zoom
  proto.render = function(context, collection, mapContext) {
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

        var style = shaderPass.evalStyle(feature.properties, mapContext);
        if (shaderPass.apply(context, style)) {
          // TODO: stroke/fill here if the style has changed to close previous polygons
        }

        coordinates = feature.coordinates;

        if (shaderPass.needsRender(feature.type, style)) {
          context.beginPath();
          switch(feature.type) {
            case VECNIK.Geometry.POINT:
              context.arc(coordinates[0], coordinates[1], VECNIK.Renderer.POINT_RADIUS, 0, Math.PI*2);
              // closes automatically
              context.fill();
            break;

            case VECNIK.Geometry.LINE:
              this._drawLineString(context, coordinates);
              // no need to close
              // no need to fill
            break;

            case VECNIK.Geometry.POLYGON:
              for (j = 0, jl = coordinates.length; j < jl; j++) {
                this._drawLineString(context, coordinates[j]);
              }
              context.closePath();
              context.fill();
            break;
          }
          context.stroke();
        }
      }
    }
  };

})(VECNIK);
