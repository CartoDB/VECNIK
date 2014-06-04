
// TODO: there should be updates during move as well

L.Vecnik = L.Canvas.extend({

  initialize: function(options) {
    L.Canvas.prototype.initialize.call(this, options);

    // TODO: use internal renderer as default
    if (!this.options.renderer) {
      throw new Error('CanvasLayer requires a renderer');
    }

    this._renderer = this.options.renderer;

    // TODO: add proper destroy() methods
    this._tileManager = new VECNIK.TileManager({
      provider: this.options.provider,
      tileSize: this.options.tileSize,
      minZoom:  this.options.minZoom,
      maxZoom:  this.options.maxZoom
    });
  },

  onAdd: function(map) {
    L.Canvas.prototype.onAdd.call(this, map);

    this._renderer.setCanvas(this._ctx.canvas);

		var
      boundsMin = this._bounds.min,
		  container = this._container,
		  size = this._bounds.getSize(),
		  r = L.Browser.retina ? 2 : 1;

		L.DomUtil.setPosition(container, boundsMin);

		container.width  = r*size.x;
		container.height = r*size.y;
		container.style.width  = size.x +'px';
		container.style.height = size.y +'px';

//		if (L.Browser.retina) {
//			this._ctx.scale(2, 2);
//		}
//		this._ctx.translate(-boundsMin.x, -boundsMin.y);

    map.on('moveend', function() {
      this._tileManager.update(map.getPixelBounds())
    }, this);

    map.on('zoomend', function() {
      this._tileManager.setZoom(map.getZoom())
    }, this);

    this._tileManager.on('change', function(tileData) {
      var renderer = this._renderer;
      // TODO: maybe move RAF to renderer
      requestAnimationFrame(function() {
        renderer.render(tileData, map.getPixelBounds().min);
      });
    }, this);

    this._tileManager.setZoom(map.getZoom());
    this._tileManager.update(map.getPixelBounds());
  },

  _update: function() {
		if (this._map._animatingZoom && this._bounds) {
      return;
    }

		L.Renderer.prototype._update.call(this);

		var
      boundsMin = this._bounds.min,
		  container = this._container;

    L.DomUtil.setPosition(container, boundsMin);

    if (this._renderer._context) { // TODO: improve this check
      this._renderer.render(this._tileManager.getData(), this._map.getPixelBounds().min);
    }

//  translate so we use the same path coordinates after canvas element moves
//	this._ctx.translate(-boundsMin.x, -boundsMin.y);
//  L.DomUtil.setPosition(container, L.DomUtil.getPosition(container).multiplyBy(-2));
//  L.DomUtil.setPosition(container, { x: 0, y: 0 });
  },

	_onMouseMove: function (e) {
		if (!this._map || this._map._animatingZoom) {
      return;
    }

		var point = this._map.mouseEventToLayerPoint(e);

//		if (this._containsPoint(point)) {
//			// if we just got inside the layer, fire mouseover
//			if (!this._mouseInside) {
//				L.DomUtil.addClass(this._container, 'leaflet-clickable'); // change cursor
//				this._fireMouseEvent(e, 'mouseover');
//				this._mouseInside = true;
//			}
//			// fire mousemove
//			this._fireMouseEvent(e);
//		}
//    else if (layer._mouseInside) {
//			// if we're leaving the layer, fire mouseout
//			L.DomUtil.removeClass(this._container, 'leaflet-clickable');
//			layer._fireMouseEvent(e, 'mouseout');
//			layer._mouseInside = false;
//		}
	}
});
