
function createCanvas(width, height) {
  var
    canvas  = document.createElement('CANVAS'),
    context = canvas.getContext('2d');
  canvas.width  = width || 0;
  canvas.height = height || 0;
  canvas.style.width  = canvas.width  +'px';
  canvas.style.height = canvas.height +'px';
  context.mozImageSmoothingEnabled    = false;
  context.webkitImageSmoothingEnabled = false;
  context.imageSmoothingEnabled       = false;
  context.lineCap  = 'round';
  context.lineJoin = 'round';
  return canvas;
}

var Canvas = module.exports = function(options) {
  options = options || {};
  this._canvas = createCanvas(options.width || options.size, options.height || options.size);
  this._context = this._canvas.getContext('2d');
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

proto.drawCircle = function(x, y, size, strokeFillOrder) {
  this._beginBatch('circle', strokeFillOrder);
  this._context.moveTo(x+size, y);
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

proto.drawText = function(text, x, y, textAlign, stroke) {
  this._finishBatch();

  if (textAlign && this._state.textAlign !== textAlign) {
    this._context.textAlign = (this._state.textAlign = textAlign);
  }

  if (stroke) {
    this._context.strokeText(text, x, y);
  }

  this._context.fillText(text, x, y);
};

// TODO: image cache is per tile-canvas, should be moved upwards to layer.

proto._images = {};

proto._loadImage = function(url, callback) {
  var
    images = this._images,
    img;

  if ((img = images[url])) {
    callback(img);
    return;
  }

  img = new Image();
  img.onload = function() {
    images[url] = this;
    callback(this);
  };
  img.src = url;
};

proto.drawImage = function(url, x, y, width) {
  var self = this;
  this._loadImage(url, function(img) {
    var
      w = img.width,
      h = img.height,
      height = width/w*h;
    self._context.drawImage(img, 0, 0, w, h, x-width/2, y-height/2, width, height);
  });
};

//proto.setStyle = function(prop, value) {
//  // checking for preset styles, for performance impacts see http://jsperf.com/osmb-context-props
//  if (typeof value !== undefined && this._state[prop] !== value) {
//    // finish previous stroke/fill operations, if any
//    this._finishBatch();
//    this._context[prop] = (this._state[prop] = value);
//  }
//};

proto.setDrawStyle = function(style) {
  var value, batchWasFinished = false;
  for (var prop in style) {
    value = style[prop];
    // checking for preset styles, for performance impacts see http://jsperf.com/osmb-context-props
    if (typeof value !== undefined && this._state[prop] !== value) {
      // finish previous stroke/fill operations, if any - but only once per setDrawStyle()
      if (!batchWasFinished) {
        this._finishBatch();
        batchWasFinished = true;
      }
      this._context[prop] = (this._state[prop] = value);
// console.log(prop, this._context[prop]);
    }
  }
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

if (strokeFillOrder[i] === 'F') {
  var url = 'http://thumb9.shutterstock.com/display_pic_with_logo/953902/125126216/stock-vector-paisley-pattern-125126216.jpg';
  var self = this;
  this._loadImage(url, function(img) {
    self._context.fillStyle = self._context.createPattern(img, 'repeat');
    self._context.fill();
  });
  continue;
}

    this._context[ this._strokeFillMapping[ strokeFillOrder[i] ] ]();
  }

  this._operation = null;
  this._strokeFillOrder = null;
};

proto.finishAll = function() {
  this._finishBatch();
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
