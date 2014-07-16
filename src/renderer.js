
var Shader = require('./shader');
var Geometry = require('./geometry');

function getStrokeFillOrder(shadingOrder) {
  var
    symbolizer,
    res = '';
  for (var i = 0, il = shadingOrder.length; i < il; i++) {
    symbolizer = shadingOrder[i];
    if (symbolizer === Shader.POLYGON) {
      res += 'F';
    }
    if (symbolizer === Shader.LINE) {
      res += 'S';
    }
  }
  return res;
}

function drawMarker(context, x, y, size) {
  // TODO: manage image sprites
  // TODO: precache render to a canvas
  context.arc(x, y, size, 0, Math.PI*2);
}

function drawLine(context, coordinates) {
  context.moveTo(coordinates[0], coordinates[1]);
  for (var i = 2, il = coordinates.length-2; i < il; i+=2) {
    context.lineTo(coordinates[i], coordinates[i+1]);
  }
};

function drawPolygon(context, coordinates) {
  for (var i = 0, il = coordinates.length; i < il; i++) {
    drawLine(context, coordinates[i]);
  }
};


var Renderer = module.exports = function(options) {
  options = options || {};
  if (!options.shader) {
    throw new Error('VECNIK.Renderer requires a shader');
  }

  this._shader = options.shader;
};

var proto = Renderer.prototype;

proto.setShader = function(shader) {
  this._shader = shader;
};

proto.getShader = function() {
  return this._shader;
};

// render the specified collection in the contenxt
// mapContext contains the data needed for rendering related to the
// map state, for the moment only zoom
proto.render = function(tile, canvas, collection, mapContext) {
  var
    layer = tile.getLayer(),
    tileCoords = tile.getCoords(),
    layers = this._shader.getLayers(),
    collection,
    shaderLayer, style,
    shadingOrder, symbolizer,
    strokeFillOrder,
    i, il, r, rl, s, sl,
    feature, coordinates,
		pos;

  canvas.clear();

  for (s = 0, sl = layers.length; s < sl; s++) {
    shaderLayer = layers[s];
    shadingOrder = shaderLayer.getShadingOrder();
    strokeFillOrder = getStrokeFillOrder(shadingOrder);

    // features are sorted according to their geometry type first
    // see https://gist.github.com/javisantana/7843f292ecf47f74a27d
    for (r = 0, rl = shadingOrder.length; r < rl; r++) {
    symbolizer = shadingOrder[r];

      for (i = 0, il = collection.length; i < il; i++) {
        feature = collection[i];
        coordinates = feature.coordinates;

        style = shaderLayer.getStyle(feature.properties, mapContext);
        switch (symbolizer) {
          case Shader.POINT:
            if ((pos = layer.getCentroid(feature)) && style.markerSize && style.markerFill) {
              canvas.drawCircle(
                pos.x-tileCoords.x * 256,
                pos.y-tileCoords.y * 256,
                style.markerSize,
                style.markerFill, style.markerStrokeStyle, style.markerLineWidth,
                strokeFillOrder
              );
            }
          break;

          case Shader.LINE:
            if (style.strokeStyle) {
              if (feature.type === Geometry.POLYGON) {
                coordinates = coordinates[0];
              }
              canvas.drawLine(
                coordinates,
                style.strokeStyle,
                style.lineWidth
              );
            }
          break;

          case Shader.POLYGON:
            if (feature.type === Geometry.POLYGON && (style.strokeStyle || style.polygonFill)) {
              canvas.drawPolygon(
                coordinates,
                style.polygonFill,
                style.strokeStyle,
                style.lineWidth,
                strokeFillOrder
              );
            }
          break;

          case Shader.TEXT:
            // TODO: solve labels closely beyond tile border
            if ((pos = layer.getCentroid(feature)) && style.textContent) {
              canvas.setFont(style.fontSize, style.fontFace);
              canvas.drawText(
                style.textContent,
                pos.x-tileCoords.x * 256,
                pos.y-tileCoords.y * 256,
                style.textAlign,
                style.textFill,
                style.textStrokeStyle,
                style.textLineWidth
              );
            }
          break;
        }
      }
    }
  }
};
