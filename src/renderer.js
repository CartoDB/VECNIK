
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


// CANVAS
//source-over
//source-in
//source-out
//source-atop
//destination-over
//destination-in
//destination-out
//destination-atop
//lighter
//darker
//copy
//xor

// MAPNIK
//src
//dst
//src-over
//dst-over
//src-in
//dst-in
//src-out
//dst-out
//src-atop
//dst-atop
//xor
//plus
//minus
//difference
//exclusion
//multiply
//contrast
//screen
//invert
//overlay
//invert-rgb
//darken
//grain-merge
//lighten
//grain-extract
//color-dodge
//hue
//color-burn
//saturation
//hard-light
//color
//soft-light
//value

var compOpMapping = {
  'src-over': 'source-over',
  'dst-over': 'destination-over',
  'src-in': 'source-in',
  'dst-in': 'destination-in',
  'src-out': 'source-out',
  'dst-out': 'destination-out',
  'src-atop': 'source-atop',
  'dst-atop': 'destination-atop',
  'darken': 'darker',
  'lighten': 'lighter',
  'xor': 'xor'
};

var defaultProperties = {
  globalOpacity: 1,
  globalCompositeOperation: 'source-over'
};

function getOpacity(value) {
  return value !== undefined ? value : 1;
}

function getCompOp(value) {
  return compOpMapping[value] ? compOpMapping[value] : 'source-over';
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
    radius, bbox,
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
            if ((pos = layer.getCentroid(feature)) && style.markerSize && (style.markerFill || style.markerFile)) {
              if (style.markerFile) {
                // no collisian check for bitmaps at the moment, as we don't know their height
                // could be solved by preloading images
                canvas.drawImage(style.markerFile, pos.x - tileCoords.x*tileSize, pos.y - tileCoords.y*tileSize, style.markerSize);
              } else {
                radius = style.markerSize/2;
                bbox = { id: feature.id, x: pos.x-radius, y: pos.y-radius, w: radius*2, h: radius*2 };
                if (style.markerAllowOverlap || !layer.hasCollision(symbolizer, bbox)) {
                  canvas.setDrawStyle({
                    strokeStyle: style.markerLineColor,
                    lineWidth: style.markerLineWidth,
                    fillStyle: style.markerFill,
                    globalOpacity: getOpacity(style.markerOpacity),
                    globalCompositeOperation: getCompOp(style.markerCompOp)
                  });
                  canvas.drawCircle(pos.x - tileCoords.x*tileSize, pos.y - tileCoords.y*tileSize, radius, 'FS' /*strokeFillOrder*/);
                  layer.addBBox(symbolizer, bbox);
                }
              }
            }
          break;

          case Shader.LINE:
            if (style.lineColor) {
              if (feature.type === Geometry.POLYGON) {
                coordinates = coordinates[0];
              }
              canvas.setDrawStyle({
                strokeStyle: style.lineColor,
                lineWidth: style.lineWidth,
                globalOpacity: getOpacity(style.lineOpacity),
                globalCompositeOperation: getCompOp(style.lineCompOp)
              });
              canvas.drawLine(coordinates);
            }
          break;

          case Shader.POLYGON:
            if (feature.type === Geometry.POLYGON && (style.lineColor || style.polygonFill || style.polygonPatternFile)) {
              if (style.polygonPatternFile) {
                canvas.setFillPattern(style.polygonPatternFile, function() {
                  canvas.setDrawStyle({
                    strokeStyle: style.lineColor,
                    lineWidth: style.lineWidth,
                    // do not set fillStyle here again. it's already done
                    globalOpacity: getOpacity(style.polygonFill),
                    globalCompositeOperation: getCompOp(style.polygonCompOp)
                  });
                  canvas.drawPolygon(coordinates, strokeFillOrder);
                });
              } else {
                canvas.setDrawStyle({
                  strokeStyle: style.lineColor,
                  lineWidth: style.lineWidth,
                  fillStyle: style.polygonFill,
                  globalOpacity: getOpacity(style.polygonFill),
                  globalCompositeOperation: getCompOp(style.polygonCompOp)
                });
                canvas.drawPolygon(coordinates, strokeFillOrder);
              }
            }
          break;

          case Shader.TEXT:
            if ((pos = layer.getCentroid(feature)) && style.textContent) {
              canvas.setFontStyle(style.fontSize, style.fontFace);
              textWidth = canvas.getTextWidth(style.textContent);
              bbox = { id: feature.id, x: pos.x, y: pos.y, w: textWidth, h: style.fontSize };
              if (style.textAllowOverlap || !layer.hasCollision(symbolizer, bbox)) {
                canvas.setDrawStyle({
                  strokeStyle: style.textOutlineColor,
                  lineWidth: style.textOutlineWidth,
                  fillStyle: style.textFill,
                  globalOpacity: getOpacity(style.textOpacity),
                  globalCompositeOperation: getCompOp(style.textCompOp)
                });
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
