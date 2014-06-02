
L.Vecnik = L.Canvas.extend({

  initialize: function(options) {
    L.Canvas.prototype.initialize.call(this, options);

    // TODO: use internal renderer as default
    if (!this.options.renderer) {
      throw new Error('CanvasLayer requires a renderer');
    }

    this._renderer = this.options.renderer;
  },

  onAdd: function(map) {
    L.Canvas.prototype.onAdd.call(this, map);

    this._renderer.setCanvas(this._ctx.canvas);

    // TODO: add proper destroy() methods
    var tileManager = new VECNIK.TileManager({
      provider: this.options.provider,
      tileSize: this.options.tileSize,
      minZoom:  this.options.minZoom,
      maxZoom:  this.options.maxZoom
    });

    // TODO: there should be updates during move as well

    map.on('moveend', function() {
      tileManager.update(map.getPixelBounds())
    }, this);

    map.on('zoomend', function() {
      tileManager.setZoom(map.getZoom())
    }, this);

    tileManager.setZoom(map.getZoom());
    tileManager.update(map.getPixelBounds());

    tileManager.on('change', function(tileData) {
      // TODO: turn tile data into a single render queue
      // TODO: all coordinates as buffers
      // TODO: consider drawing tile by tile as they arrive
      var renderer = this._renderer;
//      requestAnimationFrame(function() {
      renderer.render(tileData, map.getPixelBounds().min);
//      });
    }, this);
  },

  _update: function() {
    if (!this._renderer._context) {
      return;
    }

    L.Canvas.prototype._update.call(this);

    this._renderer.render([], this._map.getPixelBounds().min);

    var container = this._container;
//  var d = this._map.dragging._draggable;
//  L.DomUtil.setPosition(container, { x: -d._newPos.x, y: -d._newPos.y });
    L.DomUtil.setPosition(container, L.DomUtil.getPosition(container).multiplyBy(-1));
//  L.DomUtil.setPosition(container, { x: 0, y: 0 });
  }

});
