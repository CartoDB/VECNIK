
Vecnik.Canvas = function() {
  this.width  = window.innerWidth;
  this.height = window.innerHeight;

  var canvas = this.canvas = document.createElement('CANVAS');
  canvas.style.webkitTransform = 'translate3d(0,0,0)'; // turn on hw acceleration
  canvas.style.imageRendering  = 'optimizeSpeed';
  canvas.style.pointerEvents = 'none';
  canvas.style.position = 'absolute';
  canvas.style.left = 0;
  canvas.style.top  = 0;

  var context = this.context = canvas.getContext('2d');
  context.lineCap   = 'round';
  context.lineJoin  = 'round';
  context.lineWidth = 1;
  context.mozImageSmoothingEnabled    = false;
  context.webkitImageSmoothingEnabled = false;
};

Vecnik.Canvas.POINT_RADIUS = 2;

var proto = Vecnik.Canvas.prototype;

proto.appendTo = function(container) {
  container.appendChild(this.canvas);
  this.render();
  return this.canvas;
};

proto.remove = function() {
  this.clearTimeout(this.timer);
  this.canvas.parentNode.removeChild(this.canvas);
};

proto.setSize = function(size) {
  this.width = size.width;
  this.height = size.height;
  this.canvas.width  = size.width;
  this.canvas.height = size.height;
}

proto.setPosition = function(offset) {
  this.canvas.style.left = -offset.x +'px';
  this.canvas.style.top  = -offset.y +'px';
};




proto.render = function() {
  var
    context = this.context,
    i, il, j, jl,
    item, coordinates,
//    dataItems = Vecnik.Data.items;
    dataItems = [];

  context.clearRect(0, 0, this.width, this.height);

  for (i = 0, il = dataItems.length; i < il; i++) {
    item = dataItems[i];
    coordinates = item.coordinates;

//  context.strokeStyle = item.strokeColor;
//  context.fillStyle   = item.fillColor;
    context.strokeStyle = 'rgba(255,0,0,0.15)';
    context.fillStyle   = 'rgba(0,0,255,0.15)';

    context.beginPath();

    // TODO: missing a few geometry types
    switch (item.type) {
      case 'Point':
        this.drawCircle(coordinates[0], coordinates[1], Vecnik.Canvas.POINT_RADIUS);
      break;

      case 'MultiPoint':
        context.beginPath();
        for (j = 0, jl = coordinates.length; j < jl; j++) {
          this.drawCircle(coordinates[j][0], coordinates[j][1], Vecnik.Canvas.POINT_RADIUS);
        }
      break;

      case 'Polygon':
        this.drawPolygon(coordinates);
        context.closePath();
      break;

      case 'MultiPolygon':
        for (j = 0, jl = coordinates.length; j < jl; j++) {
          this.drawPolygon(coordinates[j]);
        }
        context.closePath();
      break;

      case 'LineString':
        this.drawPolyline(coordinates);
      break;
    }

    // TODO: no fill for LineString
    context.fill();
    context.stroke();
  }

  this.timer = setTimeout(this.render.bind(this), 500);
};

proto.drawPolyline = function(coordinates) {
  var context = this.context, i, il;
  context.moveTo(coordinates[0], coordinates[1]);
  for (i = 2, il = coordinates.length-1; i < il; i += 2) {
    context.lineTo(coordinates[i], coordinates[i+1]);
  }
};

proto.drawPolygon = function(coordinates) {
  for (var i = 0, il = coordinates.length; i < il; i++) {
    this.drawPolyline(coordinates[i]);
  }
};

proto.drawCircle = function(x, y, radius) {
  this.context.arc(x, y, radius, 0, Math.PI*2);
};
