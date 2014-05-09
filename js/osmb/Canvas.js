var Canvas = {

  container: null,
  canvas: doc.createElement('CANVAS'),

  create: function() {
    var container = this.container = doc.createElement('DIV');
    container.style.pointerEvents = 'none';
    container.style.position = 'absolute';
    container.style.left = 0;
    container.style.top  = 0;

    var canvas = this.canvas;
    canvas.style.webkitTransform = 'translate3d(0,0,0)'; // turn on hw acceleration
    canvas.style.imageRendering  = 'optimizeSpeed';
    canvas.style.position = 'absolute';
    canvas.style.left = 0;
    canvas.style.top  = 0;

    var context = this.context = canvas.getContext('2d');
    context.lineCap   = 'round';
    context.lineJoin  = 'round';
    context.lineWidth = 1;

    context.mozImageSmoothingEnabled    = false;
    context.webkitImageSmoothingEnabled = false;

    this.container.appendChild(canvas);

    this.render();
  },

  appendTo: function(parentNode) {
    parentNode.appendChild(this.container);
  },

  remove: function() {
    this.container.parentNode.removeChild(this.container);
  },

  setSize: function(width, height) {
    this.canvas.width  = width;
    this.canvas.height = height;
  },

  // usually called after move: container jumps by move delta, cam is reset
  setPosition: function(x, y) {
    this.container.style.left = x +'px';
    this.container.style.top  = y +'px';
  },

  render: function() {
    var
      context = this.context,
      i, il, j, jl,
      item, coordinates,
      dataItems = Data.items;

    context.clearRect(0, 0, WIDTH, HEIGHT);

    for (i = 0, il = dataItems.length; i < il; i++) {
      item = dataItems[i];
      coordinates = item.coordinates;

//    context.strokeStyle = item.strokeColor;
//    context.fillStyle = item.fillColor;
      context.strokeStyle = 'rgba(255,0,0,0.15)';
      context.fillStyle   = 'rgba(0,0,255,0.15)';

      context.beginPath();

      // TODO: missing a few geometry types
      switch (item.type) {
        case 'Point':
          this.drawCircle(coordinates[0], coordinates[1], POINT_RADIUS);
        break;

        case 'MultiPoint':
          context.beginPath();
          for (j = 0, jl = coordinates.length; j < jl; j++) {
            this.drawCircle(coordinates[j][0], coordinates[j][1], POINT_RADIUS);
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

    setTimeout(this.render.bind(this), 500);
  },

  drawPolyline: function(coordinates) {
    var context = this.context, i, il;
    context.moveTo(coordinates[0], coordinates[1]);
    for (i = 2, il = coordinates.length-1; i < il; i += 2) {
      context.lineTo(coordinates[i], coordinates[i+1]);
    }
  },

  drawPolygon: function(coordinates) {
    for (var i = 0, il = coordinates.length; i < il; i++) {
      this.drawPolyline(coordinates[i]);
    }
  },

  drawCircle: function(x, y, radius) {
    this.context.arc(x, y, radius, 0, PI*2);
  }
};


// classes:
// Canvas/Container
// renderer3d, renderer3d