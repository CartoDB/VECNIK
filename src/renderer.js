
var Geometry = require('./geometry');

var strokeFillOrder = {};
strokeFillOrder[Geometry.POLYGON] = 'fill';
strokeFillOrder[Geometry.LINE] = 'stroke';

var Renderer = module.exports = function(options) {
  options = options || {};
  if (!options.shader) {
    throw new Error('VECNIK.Renderer requires a shader');
  }

  this._shader = options.shader;
};

Renderer.POINT_RADIUS = 2;

var proto = Renderer.prototype;

proto.shader = function(_) {
  if (_) {
    this._shader = _;
    return this;
  }
  return this._shader;
};

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
    shaderLayers = this._shader.getLayers(),
    shader, style,
    i, il, j, jl, s, sl,
    feature, coordinates,
		pos, labelText;

  context.clearRect(0, 0, context.canvas.width, context.canvas.height);

  for (s = 0, sl = shaderLayers.length; s < sl; s++) {
    shader = shaderLayers[s];

    // TODO: according to processing principles, features should be sorted accorting to their type first
    // see https://gist.github.com/javisantana/7843f292ecf47f74a27d
    for (i = 0, il = collection.length; i < il; i++) {
      feature = collection[i];
      style = shader.evalStyle(feature.properties, mapContext);

      coordinates = feature.coordinates;

      if (shader.needsRender(feature.type, style)) {
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

        var order = shader.renderOrder();

        if (feature.type === Geometry.POLYGON || feature.type === Geometry.LINE) {
          context[ strokeFillOrder[order[0]] ]();
          if (order.length >= 1) {
            context[ strokeFillOrder[ order[1] ]]();
          }
        } else if (feature.type === Geometry.POINT) {
          // if case it's a point there is no render order, fill and stroke
          context.fill();
          context.stroke();
        }

        if ('needs label') { // TODO: proper check
          if (pos = this._getLabelPosition(layer, feature)) {
            labelText = feature.groupId;
// TODO: align state changes with shader.apply()
context.save();
            // TODO: use CartoCSS for text
            context.lineCap = 'round';
            context.lineJoin = 'round';
            context.strokeStyle = 'rgba(255,255,255,1)';
            context.lineWidth = 4; // text outline width
            context.font = 'bold 11px sans-serif';
            context.textAlign = 'center';
            context.strokeText(labelText, pos.x, pos.y);

            context.fillStyle = '#000';
            context.fillText(labelText, pos.x, pos.y);
context.restore();
          }
        }
      }
    }
  }
};

proto._getLabelPosition = function(layer, feature) {
  if (feature.type === Geometry.POINT) {
    return { x:feature.coordinates[0], y:feature.coordinates[1] };
  }

  var featureParts = layer.getFeatureParts(feature.groupId);
  return Geometry.getCentroid(featureParts);
};
