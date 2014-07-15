
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

// TODO: context.defaults is the ugliest thing ever. keeping this until renderer is an instance per context
function setStyle(context, prop, value) {
  if (typeof value === undefined) {
    return false;
  }
  context.defaults = context.defaults || {};
  if (context.defaults[prop] !== value) {
    context[prop] = (context.defaults[prop] = value);
  }
  return true;
}

// TODO: context.defaults is the ugliest thing ever. keeping this until renderer is an instance per context
function setFont(context, size, face) {
  if (typeof size === undefined && typeof face === undefined) {
    return false;
  }
  context.defaults = context.defaults || {};
  size = size || context.defaults.fontSize;
  face = face || context.defaults.fontFace;

  if (context.defaults.fontSize !== size || context.defaults.fontFace !== face) {
    context.defaults.fontSize = size;
    context.defaults.fontFace = face;
    context.font = size +'px '+ face;
  }

  return true;
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
proto.render = function(tile, context, collection, mapContext) {
  var
    layer = tile.getLayer(),
    tileCoords = tile.getCoords(),
    layers = this._shader.getLayers(),
    collection,
    shaderLayer, style,
    shadingOrder, shadingType,
    strokeAndFill,
    i, il, r, rl, s, sl,
    feature, coordinates,
		pos, posX, posY;

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

        style = shaderLayer.getStyle(feature.properties, mapContext);
        switch (shadingType) {
          case Shader.POINT:
            if ((pos = layer.getCentroid(feature)) && style.markerSize && style.markerFill) {
              posX = pos.x-tileCoords.x * 256;
              posY = pos.y-tileCoords.y * 256;

              drawMarker(context, posX, posY, style.markerSize);
              // TODO: fix logic of stroke/fill once per pass
              setStyle(context, 'fillStyle', style.markerFill);
              context.fill();
              if (setStyle(context, 'strokeStyle', style.markerStrokeStyle)) {
                setStyle(context, 'lineWidth', style.markerLineWidth);
                context.stroke();
              }
            }
          break;

          case Shader.LINE:
            if (style.strokeStyle) {
              if (feature.type === Geometry.POLYGON) {
                coordinates = coordinates[0];
              }
              context.beginPath();
              drawLine(context, coordinates);
              // TODO: fix logic of stroke/fill once per pass
              // 'line-opacity': 'globalAlpha',
              setStyle(context, 'strokeStyle', style.strokeStyle);
              setStyle(context, 'lineWidth', style.lineWidth);
              context.stroke();
            }
          break;

          case Shader.POLYGON:
            // QUESTION: should we try to draw lines and points as well here?
            if (feature.type === Geometry.POLYGON && (style.strokeStyle || style.polygonFill)) {
              context.beginPath();
              drawPolygon(context, coordinates);
              context.closePath();
              // TODO: fix logic of stroke/fill once per pass
              // 'line-opacity': 'globalAlpha',
              // 'polygon-opacity': 'globalAlpha',
              setStyle(context, 'strokeStyle', style.strokeStyle);
              setStyle(context, 'lineWidth', style.lineWidth);
              setStyle(context, 'fillStyle', style.polygonFill);
              strokeAndFill[0] && context[ strokeAndFill[0] ]();
              strokeAndFill[1] && context[ strokeAndFill[1] ]();
            }
          break;

          case Shader.TEXT:
            if ((pos = layer.getCentroid(feature)) && style.textContent) {
              posX = pos.x-tileCoords.x * 256;
              posY = pos.y-tileCoords.y * 256;
              // TODO: check, whether to do outline at all
              // 'text-opacity': 'globalAlpha',
              // context.font = 'bold 11px sans-serif';
              setFont(context, style.fontSize, style.fontFace);
              setStyle(context, 'textAlign', style.textAlign);

              if (setStyle(context, 'strokeStyle', style.textStrokeStyle)) {
                setStyle(context, 'lineWidth', style.textLineWidth);
                context.strokeText(style.textContent, posX, posY);
              }

              setStyle(context, 'fillStyle', style.textFill);
              context.fillText(style.textContent, posX, posY);
            }
          break;
        }
      }
    }
  }
};

// TODO: solve labels closely beyond tile border

/***
prop = props[i];
// careful, setter context.fillStyle = '#f00' but getter context.fillStyle === '#ff0000' also upper case, lower case...
//
// color parse (and probably other props) depends on canvas implementation so direct
// comparasions with context contents can't be done.
// use an extra object to store current state
// * chrome 35.0.1916.153:
// ctx.strokeStyle = 'rgba(0,0,0,0.1)'
// ctx.strokeStyle -> "rgba(0, 0, 0, 0.09803921568627451)"
// * ff 29.0.1
// ctx.strokeStyle = 'rgba(0,0,0,0.1)'
// ctx.strokeStyle -> "rgba(0, 0, 0, 0.1)"
***/