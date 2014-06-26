
module('cartoshader');
var shader, canvas, ctx;

  QUnit.testStart(function( details ) {
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d')
    shader = new VECNIK.CartoShader({
      'point-color': '#ffffff',
      'line-color': function(data) {
        return data.color;
      },
      'line-width': 1,
      'polygon-fill': '#0000ff'
    });
  });
/***
  test('should tell when line should be rendered', function() {
    var c = new VECNIK.CartoShader({
      'line-color': '#fff'
    });
    var st = c.evalStyle({})
    equal(c.needsRender('LineString', st), true);
    equal(c.needsRender('LineString', st), true);
    equal(c.needsRender('LineString', st), true);
    equal(c.needsRender('Polygon', st), true);
    equal(c.needsRender('Point', st), false);

    c = new VECNIK.CartoShader({
      'polygon-fill': '#fff'
    });
    var st = c.evalStyle({})
    equal(c.needsRender('LineString', st), false);
    equal(c.needsRender('Point', st), false);
    equal(c.needsRender('Polygon', st), true);

    c = new VECNIK.CartoShader({
      'line-color': function(data) {
        if (data.value > 1) {
          return '#fff';
        }
      }
    });
    equal(c.needsRender('LineString', c.evalStyle({ value: 0 })), false);
    equal(c.needsRender('LineString', c.evalStyle({ value: 0 })), false);

    c = new VECNIK.CartoShader({
      'line-color': function(data, ctx) {
        if (ctx.zoom > 1) {
          return '#fff';
        }
      }
    });
    equal(c.needsRender('LineString', c.evalStyle({ value: 0 })), false);
    equal(c.needsRender('LineString', c.evalStyle({ value: 0 }, { zoom: 1 })), false);
    equal(c.needsRender('LineString', c.evalStyle({ value: 0 }, { zoom: 2 })), true);
  });

***/

/***
  VECNIK.Renderer = function(options) {
    options = options || {};
    if (!options.shader) {
      throw new Error('VECNIK.Renderer requires a shader');
    }
    this._shaders = options.shader.length ? options.shader : [options.shader];
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
***/