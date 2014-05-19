//========================================
// vecnik views
//========================================

(function(VECNIK) {

  function Renderer(context) {
    this.context = context;
  };

  var proto = Renderer.prototype;

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

//  proto.render = function(ctx, geometry, zoom, shader) {
//    for (var i = 0; i < geometry.length; ++i) {
//      var render_context = {
//        zoom: zoom,
//        id: i
//      };
//      var isActive = true;
//      if (shader) {
//        is_active = shader.needs_render(geo.metadata, render_context, geo.type);
//        if (isActive) {
//          shader.reset(ctx, geo.type);
//          shader.apply(ctx, geo.metadata, render_context);
//        }
//      }
//      if (isActive) {
//        renderer(ctx, geo.vertexBuffer);
//      }
//    }
//  };

  proto.render = function(context, geometry) { // zoom, shader
this.context = context;
    var
//    context = this.context,
      i, il, j, jl,
      item, coordinates;

//    context.clearRect(0, 0, this.width, this.height);
    context.canvas.width = context.canvas.width;

    for (i = 0, il = geometry.length; i < il; i++) {
      item = geometry[i];
      coordinates = item.vertexBuffer;

  //  context.strokeStyle = item.strokeColor;
  //  context.fillStyle   = item.fillColor;
      context.strokeStyle = 'rgba(255,0,0,0.15)';
      context.fillStyle   = 'rgba(0,0,255,0.15)';

      context.beginPath();

      // TODO: missing a few geometry types
      switch (item.type) {
        case 'Point':
          this.drawCircle(coordinates[0], coordinates[1], VECNIK.POINT_RADIUS);
        break;

        case 'MultiPoint':
          context.beginPath();
          for (j = 0, jl = coordinates.length; j < jl; j++) {
            this.drawCircle(coordinates[j][0], coordinates[j][1], VECNIK.POINT_RADIUS);
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
  };

  //========================================
  // Canvas tile view
  //========================================
  function CanvasTile(tile, shader, renderer) {
    this.tileSize = new VECNIK.Point(256, 256);
    var canvas = document.createElement('canvas');
    canvas.width = this.tileSize.x;
    canvas.height = this.tileSize.y;
    this.ctx = canvas.getContext('2d');
    this.canvas = canvas;

    this.el = canvas;
    this.id = tile.key();
    this.el.setAttribute('id', tile.key());
    var self = this;
    this.tile = tile;
    var render =  function(){self.render();};
    tile.on('geometry_ready', render);

    // shader
    this.shader = shader;
    if (shader) {
      shader.on('change', render);
    }
    this.renderer = renderer || new Renderer();

    this.profiler = new VECNIK.Profiler('tile_render');
    this.stats = {
      rendering_time: 0
    }
  }

  CanvasTile.prototype.remove = function() {};

  CanvasTile.prototype.render = function() {
    var ctx = this.ctx;

    this.profiler.start('render');
    this.renderer.render(ctx, this.tile.geometry(), this.tile.zoom, this.shader);

    this.stats.rendering_time = this.profiler.end();
  };

  //========================================
  // Map view
  // manages the list of tiles
  //========================================
  function CanvasTileManager() {
    this.tiles = {};
  }

  CanvasTileManager.prototype.add = function(canvasview) {
    this.tiles[canvasview.id] = canvasview;
  };

  CanvasTileManager.prototype.getByElement = function(el) {
    return this.tiles[el.getAttribute('id')];
  };

  VECNIK.Renderer = Renderer;
  VECNIK.POINT_RADIUS = 2;
  VECNIK.CanvasTile = CanvasTile;
  VECNIK.CanvasTileManager = CanvasTileManager;

})(VECNIK);
