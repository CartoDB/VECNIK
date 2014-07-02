
var Geometry = require('./geometry');

var orderMethods = {};
orderMethods[Geometry.POLYGON] = 'fill';
orderMethods[Geometry.LINE] = 'stroke';

var Renderer = module.exports = function(options) {
  options = options || {};
  if (!options.shader) {
    throw new Error('VECNIK.Renderer requires a shader');
  }

  this._shader = options.shader;
};

Renderer.POINT_RADIUS = 2;

var proto = Renderer.prototype;

proto._drawLineString = function(context, coordinates) {
  context.moveTo(coordinates[0], coordinates[1]);
  for (var i = 2, il = coordinates.length-2; i < il; i+=2) {
    context.lineTo(coordinates[i], coordinates[i+1]);
  }
};

proto._drawMarker = function (context, coordinates, size) {
  //TODO: manage image sprites
  //TODO: precache render to a canvas
  context.arc(coordinates[0], coordinates[1], size, 0, Math.PI*2);
};

// render the specified collection in the contenxt
// mapContext contains the data needed for rendering related to the
// map state, for the moment only zoom
proto.render = function(layer, context, collection, mapContext) {
  var
    shaders = this._shader.getLayers(),
    shaderPass, style,
    i, il, j, jl, s, sl,
    feature, coordinates,
		labelPositions, pos;

  context.clearRect(0, 0, context.canvas.width, context.canvas.height);

  for (s = 0, sl = shaders.length; s < sl; s++) {
    shaderPass = shaders[s];

		labelPositions = [];

    for (i = 0, il = collection.length; i < il; i++) {
      feature = collection[i];

      // TODO: we need a better place to call this as labels are drawn in another pass
      // if lable has to be drawn:
      if (pos = this._getLabelPosition(layer, feature)) {
        labelPositions.push(pos);
      }

      style = shaderPass.evalStyle(feature.properties, mapContext);

      coordinates = feature.coordinates;

      if (shaderPass.needsRender(feature.type, style)) {
        context.beginPath();

        switch(feature.type) {
          case Geometry.POINT:
            this._drawMarker(context, coordinates, style['marker-width']);
          break;

          case Geometry.LINE:
            this._drawLineString(context, coordinates);
          break;

          case Geometry.POLYGON:
            for (j = 0, jl = coordinates.length; j < jl; j++) {
              this._drawLineString(context, coordinates[j]);
            }
            context.closePath();
          break;
        }

        if (shaderPass.apply(context, style)) {
          // TODO: stroke/fill here if the style has changed to close previous polygons
        }

        var order = shaderPass.renderOrder();
        if (feature.type === Geometry.POLYGON ||
            feature.type === Geometry.LINE) {
          context[orderMethods[order[0]]]();
          order.length >=1 && context[orderMethods[order[1]]]();
        } else if (feature.type === Geometry.POINT) {
          // if case it's a point there is no render order, fill and stroke
          context.fill();
          context.stroke();
        }
      }
    }

    // console.log(JSON.stringify(labelPositions));
  }
};

proto._getLabelPosition = function(layer, feature) {
  var featureParts = layer.getFeatureParts(feature.groupId);
  return Geometry.getCentroid(featureParts);
};
