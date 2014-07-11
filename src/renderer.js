
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

proto.setShader = function(shader) {
  this._shader = shader;
};

proto.getShader = function() {
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
proto.render = function(tile, context, collectionByType, mapContext) {
  var
    layer = tile.getLayer(),
    tileCoords = tile.getCoords(),
    layers = this._shader.getLayers(),
    collection,
    shaderLayer, style, renderOrder,
    type,
    i, il, j, jl, r, rl, s, sl,
    feature, coordinates,
		pos, labelX, labelY, labelText;

  context.clearRect(0, 0, context.canvas.width, context.canvas.height);

  for (s = 0, sl = layers.length; s < sl; s++) {
    shaderLayer = layers[s];
    renderOrder = shaderLayer.getRenderOrder();

    // features are sorted according to their type first
    // see https://gist.github.com/javisantana/7843f292ecf47f74a27d
    for (r = 0, rl = renderOrder.length; r < rl; r++) {
      type = renderOrder[r];
      collection = collectionByType[type] || [];

      for (i = 0, il = collection.length; i < il; i++) {
        feature = collection[i];
        coordinates = feature.coordinates;

        // this needs to be handled further up
        style = shaderLayer.evalStyle(feature.properties, mapContext);

        if (shaderLayer.needsRender(feature.type, style)) {
          context.beginPath();

          switch(type) {
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

            case Geometry.TEXT:
              // TODO
            break;
          }

          shaderLayer.apply(context, style);

          if (type === Geometry.POLYGON || type === Geometry.LINE) {
console.log(renderOrder)
            context[ strokeFillOrder[ renderOrder[0] ] ]();
            if (renderOrder.length >= 1) {
              context[ strokeFillOrder[ renderOrder[1] ]]();
            }
          } else if (type === Geometry.POINT) {
            // if case it's a point there is no render order, fill and stroke
            context.fill();
            context.stroke();
          }

          if ('needs label') { // TODO: proper check
            if (pos = layer.getLabelPosition(feature)) {
              // TODO: check whether it makes sense to draw, even with tolerance
              labelX = pos.x-tileCoords.x * 256;
              labelY = pos.y-tileCoords.y * 256;

              labelText = feature.groupId;
  // TODO: align state changes with shaderLayer.apply()
  context.save();
              // TODO: use CartoCSS for text
              context.lineCap = 'round';
              context.lineJoin = 'round';
              context.strokeStyle = 'rgba(255,255,255,1)';
              context.lineWidth = 4; // text outline width
              context.font = 'bold 11px sans-serif';
              context.textAlign = 'center';
              context.strokeText(labelText, labelX, labelY);

              context.fillStyle = '#000';
              context.fillText(labelText, labelX, labelY);
  context.restore();
            }
          }
        }
      }
    }
  }
};

// TODO: make sure, label has not yet been rendered somewhere else
// on render -> check other tiles, whether it has been drawn already
// TODO: avoid overlapping
// TODO: solve labels close outside tile border
