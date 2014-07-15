
// TODO: stroke/fill order
// var shadingOrder, strokeAndFill;
// strokeAndFill = getStrokeFillOrder(shadingOrder);

var Canvas = module.exports = function(options) {
  options = options || {};

  var
    canvas  = this._canvas  = document.createElement('CANVAS'),
    context = this._context = canvas.getContext('2d');

  canvas.width  = options.width  || options.size || 0;
  canvas.height = options.height || options.size || 0;
  canvas.style.width  = canvas.width  +'px';
  canvas.style.height = canvas.height +'px';

  context.mozImageSmoothingEnabled    = false;
  context.webkitImageSmoothingEnabled = false;

  context.lineCap  = 'round';
  context.lineJoin = 'round';

  this._state = {};
};

var proto = Canvas.prototype;

proto.getDomElement = function() {
  return this._canvas;
};

proto.getContext = function() {
  return this._context;
};

proto.clear = function() {
  this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
};

proto.getData = function() {
  return this._context.getImageData(0, 0, this._canvas.width, this._canvas.height).data;
};

proto._drawLineSegments = function(coordinates) {
  var context = this._context;
  context.moveTo(coordinates[0], coordinates[1]);
  for (var i = 2, il = coordinates.length-2; i < il; i+=2) {
    context.lineTo(coordinates[i], coordinates[i+1]);
  }
};

proto.drawCircle = function(x, y, size, fill, stroke, lineWidth) {
  if ((!fill && !stroke) || !size) {
    return;
  }

  this.setStrokeStyle(stroke, lineWidth);
  this.setFillStyle(fill);

  this._beginBatch('circle', 'SF');

  this._context.arc(x, y, size, 0, Math.PI*2);
};

proto.drawLine = function(coordinates, stroke, lineWidth) {
  if (!stroke) {
    return;
  }

  this.setStrokeStyle(stroke, lineWidth);

  this._beginBatch('line', 'S');

  this._drawLineSegments(coordinates);
};

proto.drawPolygon = function(coordinates, fill, stroke, lineWidth) {
  if (!fill && !stroke) {
    return;
  }

  this.setStrokeStyle(stroke, lineWidth);
  this.setFillStyle(fill);

  this._beginBatch('polygon', 'SF');

  for (var i = 0, il = coordinates.length; i < il; i++) {
    this._drawLineSegments(coordinates[i]);
  }
};

proto.drawText = function(text, x, y, align, fill, stroke, lineWidth) {
  if (!text || !(fill && stroke)) {
    return;
  }

  this._finishBatch();

  var context = this._context;

  this.setStyle('textAlign', align);

  if (stroke) {
    this.setStrokeStyle(stroke, lineWidth);
    context.strokeText(text, x, y);
  }

  this.setFillStyle(fill);
  context.fillText(text, x, y);
};

// TODO: rethink, whether a (newly) undefined value should cause this._finishBatch()
proto.setStyle = function(prop, value) {
  // checking for preset styles, for performance impacts see http://jsperf.com/osmb-context-props
  if (typeof value !== undefined && this._state[prop] !== value) {
    // finish previous stroke/fill operations, if any
    this._finishBatch();
    this._context[prop] = (this._state[prop] = value);
  }
};

proto.setFillStyle = function(fill) {
  this.setStyle('fillStyle', fill);
};

proto.setStrokeStyle = function(stroke, lineWidth) {
  this.setStyle('strokeStyle', stroke);
  this.setStyle('lineWidth', lineWidth);
};

proto._strokeFillMapping = {
  S: 'stroke',
  F: 'fill'
};

proto._beginBatch = function(operation, strokeFillOrder) {
  if (this._operation === operation && this._strokeFillOrder === strokeFillOrder) {
    return;
  }
  this._finishBatch();
  this._operation = operation;
  this._strokeFillOrder = strokeFillOrder || 'S';
  this._context.beginPath();
};

proto._finishBatch = function() {
  if (!this._operation) {
    return;
  }

  var strokeFill = this._strokeFillOrder;

  for (var i = 0, il = strokeFill.length; i < il; i++) {
    if (strokeFill[i] === 'F') {
      this._context.closePath();
    }
    this._context[ this._strokeFillMapping[ strokeFill[i] ] ]();
  }

  this._operation = null;
  this._strokeFillOrder = null;
};

proto.setFont = function(size, face) {
  if (typeof size !== undefined || typeof face !== undefined) {
    size = size || this._state.fontSize;
    face = face || this._state.fontFace;
    if (this._state.fontSize !== size || this._state.fontFace !== face) {
      this._state.fontSize = size;
      this._state.fontFace = face;
      this._context.font = size +'px '+ face;
      return true;
    }
  }
};




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
