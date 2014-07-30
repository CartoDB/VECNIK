
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
  context.imageSmoothingEnabled       = false;

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

proto._isSameColor = function(data, a, b) {
  return (
    data[a  ] === data[b  ] &&
    data[a+1] === data[b+1] &&
    data[a+2] === data[b+2]);
};

proto.filterArtifacts = function() {
  var
    canvas = this._canvas,
    imgData = this._context.getImageData(0, 0, canvas.width, canvas.height),
    rowLength = canvas.width,
    rowNum = canvas.height,
    data = imgData.data,
    i;

  for (var r = 0; r < rowNum; r++) {
    for (var c = 0; c < rowLength; c++) {
      i = (r*rowLength + c)*4;
      if (!data[i+3]) {
        continue;
      }

      if (data[i+3] < 255) {
        data[i  ] = 0;
        data[i+1] = 0;
        data[i+2] = 0;
        data[i+3] = 255;
        continue;
      }

      if (
        !this._isSameColor(data, i, i + 4) &&
        !this._isSameColor(data, i, i - 4) &&
        !this._isSameColor(data, i, i - rowLength*4) &&
        !this._isSameColor(data, i, i + rowLength*4)
      ) {
        data[i  ] = 0;
        data[i+1] = 0;
        data[i+2] = 0;
        data[i+3] = 255;
      }
    }
  }

  this._context.putImageData(imgData, 0, 0);
};

proto.drawCircle = function(x, y, size, strokeFillOrder) {
  this._beginBatch('circle', strokeFillOrder);
  this._context.arc(x, y, size, 0, Math.PI*2);
};

proto.drawLine = function(coordinates) {
  this._beginBatch('line', 'S');
  var context = this._context;
  context.moveTo(coordinates[0], coordinates[1]);
  for (var i = 2, il = coordinates.length-1; i < il; i+=2) {
    context.lineTo(coordinates[i], coordinates[i+1]);
  }
};

proto.drawPolygon = function(coordinates, strokeFillOrder) {
  this._beginBatch('polygon', strokeFillOrder);

  var j, jl;
  var context = this._context;
  for (var i = 0, il = coordinates.length; i < il; i++) {
    context.moveTo(coordinates[i][0], coordinates[i][1]);
    for (j = 2, jl = coordinates[i].length-1; j < jl; j+=2) {
      context.lineTo(coordinates[i][j], coordinates[i][j+1]);
    }
  }
};

proto.drawText = function(text, x, y, align, stroke) {
  this._finishBatch();

  this.setStyle('textAlign', align);

  if (stroke) {
    this._context.strokeText(text, x, y);
  }

  this._context.fillText(text, x, y);
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


proto._strokeFillMapping = {
  S: 'stroke',
  F: 'fill'
};

proto._beginBatch = function(operation, strokeFillOrder) {
// if (operation === 'polygon') console.log('BATCH', strokeFillOrder, this._state.fillStyle);

  if (this._operation === operation && this._strokeFillOrder === strokeFillOrder) {
    return;
  }
  this._finishBatch();
  this._operation = operation;
  this._strokeFillOrder = strokeFillOrder;
  this._context.beginPath();
};

proto._finishBatch = function() {
  if (!this._operation) {
    return;
  }

  var strokeFillOrder = this._strokeFillOrder;

  for (var i = 0, il = strokeFillOrder.length; i < il; i++) {
    this._context[ this._strokeFillMapping[ strokeFillOrder[i] ] ]();
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
