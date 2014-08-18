
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
    tileSize = tile.getSize(),
    layers = this._shader.getLayers(),
    collection,
    shaderLayer, style,
    shadingOrder, symbolizer,
    strokeFillOrder,
    i, il, r, rl, s, sl,
    feature, coordinates,
		pos,
    radius, bbox, hasCollision,
    textWidth;

  canvas.clear();

  // for render order see https://gist.github.com/javisantana/7843f292ecf47f74a27d

  for (s = 0, sl = layers.length; s < sl; s++) {
    shaderLayer = layers[s];
    shadingOrder = shaderLayer.getShadingOrder();
    strokeFillOrder = getStrokeFillOrder(shadingOrder);

    for (r = 0, rl = shadingOrder.length; r < rl; r++) {
      symbolizer = shadingOrder[r];

      for (i = 0, il = collection.length; i < il; i++) {
        feature = collection[i];
        coordinates = feature.coordinates;

        style = shaderLayer.getStyle(feature.properties, mapContext);
        switch (symbolizer) {
          case Shader.POINT:
            if ((pos = layer.getCentroid(feature)) && style.markerSize && style.markerFill) {
              radius = style.markerSize/2;
              bbox = { id: feature.id, x: pos.x-radius, y: pos.y-radius, w: radius*2, h: radius*2 };
              hasCollision = !style.markerAllowOverlap && layer.hasCollision(symbolizer, bbox);
              if (!hasCollision) {
                canvas.setDrawStyle(
                  style.markerLineColor,
                  style.markerLineWidth,
                  style.markerFill,
                  style.markerOpacity
                );
                canvas.drawCircle(pos.x - tileCoords.x*tileSize, pos.y - tileCoords.y*tileSize, radius, 'FS' /*strokeFillOrder*/);
                layer.addBBox(symbolizer, bbox);
              }
            }
          break;

          case Shader.LINE:
            if (style.lineColor) {
              if (feature.type === Geometry.POLYGON) {
                coordinates = coordinates[0];
              }
              canvas.setDrawStyle(
                style.lineColor,
                style.lineWidth,
                undefined,
                style.lineOpacity
              );
              canvas.drawLine(coordinates);
            }
          break;

          case Shader.POLYGON:
            if (feature.type === Geometry.POLYGON && (style.lineColor || style.polygonFill)) {
              canvas.setDrawStyle(
                style.lineColor,
                style.lineWidth,
                style.polygonFill,
                style.polygonOpacity
              );
              canvas.drawPolygon(coordinates, strokeFillOrder);
            }
          break;

          case Shader.TEXT:
            if ((pos = layer.getCentroid(feature)) && style.textContent) {
              canvas.setFont(style.fontSize, style.fontFace);
              textWidth = canvas._context.measureText(style.textContent).width;
              bbox = { id: feature.id, x: pos.x, y: pos.y, w: textWidth, h: style.fontSize };
              hasCollision = !style.textAllowOverlap && layer.hasCollision(symbolizer, bbox);
              if (!hasCollision) {
                canvas.setDrawStyle(
                  style.textOutlineColor,
                  style.textOutlineWidth,
                  style.textFill,
                  style.textOpacity
                );
                canvas.drawText(style.textContent, pos.x - tileCoords.x*tileSize, pos.y - tileCoords.y*tileSize, style.textAlign, !!style.textOutlineColor);
                layer.addBBox(symbolizer, bbox);
              }
            }
          break;
        }
      }
      canvas.finishAll();
    }
  }
};
