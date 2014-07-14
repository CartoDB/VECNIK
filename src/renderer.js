
var Shader = require('./shader');
var Geometry = require('./geometry');

function getStrokeFillOrder(shadingOrder) {
  var
    shadingType,
    res = [];
  for (var i = 0, il = shadingOrder.length; i < il; i++) {
    shadingType = shadingOrder[i];
    if (shadingType === Shader.POLYGON) {
      res.push('fill');
    }
    if (shadingType === Shader.LINE) {
      res.push('stroke');
    }
  }
  return res;
}

function drawMarker(context, center, size) {
  // TODO: manage image sprites
  // TODO: precache render to a canvas
  context.arc(center.x, center.y, size, 0, Math.PI*2);
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

Renderer.POINT_RADIUS = 2;

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
proto.render = function(tile, context, collection, mapContext) {
  var
    layer = tile.getLayer(),
    tileCoords = tile.getCoords(),
    layers = this._shader.getLayers(),
    collection,
    shaderLayer, style,
    shadingOrder, shadingType,
    strokeAndFill,
    i, il, j, jl, r, rl, s, sl,
    feature, coordinates,
		pos, labelX, labelY, labelText;

  context.clearRect(0, 0, context.canvas.width, context.canvas.height);

  for (s = 0, sl = layers.length; s < sl; s++) {
    shaderLayer = layers[s];
    shadingOrder = shaderLayer.getShadingOrder();
    strokeAndFill = getStrokeFillOrder(shadingOrder);


    // features are sorted according to their geometry type first
    // see https://gist.github.com/javisantana/7843f292ecf47f74a27d
    for (r = 0, rl = shadingOrder.length; r < rl; r++) {
      shadingType = shadingOrder[r];

      for (i = 0, il = collection.length; i < il; i++) {
        feature = collection[i];
        coordinates = feature.coordinates;

        // QUESTION: could we combine next 2 lines?
        style = shaderLayer.evalStyle(feature.properties, mapContext);

        if (shaderLayer.needsRender(shadingType, style)) {
          shaderLayer.apply(context, style);

          switch (shadingType) {
            case Shader.POINT:
              if (pos = layer.getCentroid(feature)) {
                drawMarker(context, pos, style['marker-width']);
                // TODO: fix logic of stroke/fill once per pass
                context.fill();
                context.stroke();
              }
            break;

            case Shader.LINE:
              if (feature.type === Geometry.POLYGON) {
                coordinates = coordinates[0]
              }
              context.beginPath();
              drawLine(context, coordinates);
              // TODO: fix logic of stroke/fill once per pass
              context.stroke();
            break;

            case Shader.POLYGON:
              // QUESTION: should we try to draw lines and points as well here?
              if (feature.type === Geometry.POLYGON) {
                context.beginPath();
                drawPolygon(context, coordinates);
                context.closePath();
                // TODO: fix logic of stroke/fill once per pass
                strokeAndFill[0] && context[ strokeAndFill[0] ]();
                strokeAndFill[1] && context[ strokeAndFill[1] ]();
              }
            break;

            case Shader.TEXT:
              if (pos = layer.getCentroid(feature)) {
                labelX = pos.x-tileCoords.x * 256;
                labelY = pos.y-tileCoords.y * 256;

                // TODO: align state changes with shaderLayer.apply()
                context.save();
                // TODO: use CartoCSS for text
                context.lineCap = 'round';
                context.lineJoin = 'round';
                context.strokeStyle = 'rgba(255,255,255,1)';
                context.lineWidth = 4; // text outline width
                context.font = 'bold 11px sans-serif';
                context.textAlign = 'center';
                context.strokeText(style['text-name'], labelX, labelY);

                context.fillStyle = '#000';
                context.fillText(style['text-name'], labelX, labelY);
                context.restore();
              }
            break;
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
