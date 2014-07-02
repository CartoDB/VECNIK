
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
    shaders = this._shader.getLayers(),
    shaderPass, style,
    i, il, j, jl, s, sl,
    feature, coordinates;

  context.clearRect(0, 0, context.canvas.width, context.canvas.height);

  for (s = 0, sl = shaders.length; s < sl; s++) {
    shaderPass = shaders[s];

		labels = [];

    for (i = 0, il = collection.length; i < il; i++) {
      feature = collection[i];

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
  }
};











// render the specified collection in the contenxt
// mapContext contains the data needed for rendering related to the
// map state, for the moment only zoom
proto.renderLabels = function(layer, container, collection, mapContext) {
  var
    shaders = this._shader.getLayers(),
    shaderPass, style,
    i, il, s, sl,
    label,
    feature,
		pos;

  container.innerHTML = '';

  // TODO: use disconnected DOM
  for (s = 0, sl = shaders.length; s < sl; s++) {
    shaderPass = shaders[s];

    for (i = 0, il = collection.length; i < il; i++) {
      feature = collection[i];

      style = shaderPass.evalStyle(feature.properties, mapContext);

      // CartoCSS => text-name:feature.property.columnName
      // if label has to be drawn:
      if (pos = this._getLabelPosition(layer, feature)) {
//      shaderPass.textApply(context, label.style);
        label = document.createElement('LABEL');

label.innerText = feature.groupId;
label.style.color = 'rgba(255,255,255,1)';
label.style.font = 'bold 11px sans-serif';
//label.style.textAlign = 'center';
label.style.position = 'absolute';
//label.style.display = 'block';
label.style.left = pos.x +'px';
label.style.top = pos.y +'px';
label.style.textShadow = '0.5px  0.5px 0.5px black, 0.5px -1px 0.5px black, -1px 0.5px 0.5px black, -1px -1px 0.5px black';
label.style.cursor = 'text';
//label.style.pointerEvents = 'none';
      label.addEventListener('selectstart', function(e) {
        e.stopPropagation();
        console.log('sel.start');
      });


        container.appendChild(label);
      }
    }
  }
};










proto._getLabelPosition = function(layer, feature) {
  var featureParts = layer.getFeatureParts(feature.groupId);
  return Geometry.getCentroid(featureParts);
};
