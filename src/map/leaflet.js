
L.CanvasLayer = L.Class.extend({

  includes: [L.Mixin.Events, L.Mixin.TileLoader],

  options: {
    minZoom: 0,
    maxZoom: 28,
    tileSize: 256,
    subdomains: 'abc',
    errorTileUrl: '',
    attribution: '',
    zoomOffset: 0,
    opacity: 1,
    unloadInvisibleTiles: L.Browser.mobile,
    updateWhenIdle: L.Browser.mobile
  },

  initialize: function(options) {
    options = options || {};
    L.Util.setOptions(this, options);

    if (!this.options.provider) {
      throw new Error('CanvasLayer requires a provider');
    }

    // TODO: use internal renderer as default
    if (!this.options.renderer) {
      throw new Error('CanvasLayer requires a renderer');
    }

    //this.project = this._project.bind(this);
    this.render = this.render.bind(this);
    this._canvas = this._createCanvas();
    // backCanvas for zoom animation
    this._backCanvas = this._createCanvas();
    this._ctx = this._canvas.getContext('2d');
    this.currentAnimationFrame = -1;

    this.requestAnimationFrame = window.requestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function(callback) {
        return window.setTimeout(callback, 1000 / 60);
      };

    this.cancelAnimationFrame = window.cancelAnimationFrame ||
      window.mozCancelAnimationFrame ||
      window.webkitCancelAnimationFrame ||
      window.msCancelAnimationFrame ||
      function(id) {
        clearTimeout(id);
      };
  },

  _createCanvas: function() {
    var canvas;
    canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = this.options.zIndex || 0;
    var className = 'leaflet-tile-container leaflet-zoom-animated';
    canvas.setAttribute('class', className);
    return canvas;
  },

  onAdd: function (map) {
    this._map = map;

    // add container with the canvas to the tile pane
    // the container is moved in the oposite direction of the
    // map pane to keep the canvas always in (0, 0)
    var tilePane = this._map._panes.tilePane;
    var container = L.DomUtil.create('div', 'leaflet-layer');
    container.appendChild(this._canvas);
    container.appendChild(this._backCanvas);
    this._backCanvas.style.display = 'none';
    tilePane.appendChild(container);

    this._container = container;

    // hack: listen to predrag event launched by dragging to
    // set container in position (0, 0) in screen coordinates
    if (map.dragging.enabled()) {
      map.dragging._draggable.on('predrag', function() {
        var d = map.dragging._draggable;
        L.DomUtil.setPosition(this._canvas, { x: -d._newPos.x, y: -d._newPos.y });
      }, this);
    }

    map.on({
      viewreset: this._reset,
      move:      this.render,
      resize:    this._reset,
      zoomanim:  this._animateZoom,
      zoomend:   this._endZoomAnim
    }, this);

    this._initTileLoader();

    var self = this;
    this.on('tileAdded', function(coords) {
      var tile = new VECNIK.Tile(coords.x, coords.y, coords.zoom)
      VECNIK.load(this.options.provider.getUrl(coords.x, coords.y, coords.zoom), function(data) {
        tile.set(data);
        self._tileLoaded(coords, tile);
  //    self.redraw();
      });
    });

    this._reset();
  },

  _animateZoom: function(e) {
    if (!this._animating) {
      this._animating = true;
    }
    var back = this._backCanvas;

    back.width = this._canvas.width;
    back.height = this._canvas.height;

    // paint current canvas in back canvas with trasnformation
    back.getContext('2d').drawImage(this._canvas, 0, 0);

    // hide original
    this._canvas.style.display = 'none';
    back.style.display = 'block';
    var map = this._map;
    var newCenter = map._latLngToNewLayerPoint(map.getCenter(), e.zoom, e.center);
    var oldCenter = map._latLngToNewLayerPoint(e.center, e.zoom, e.center);

    var origin = {
      x: newCenter.x-oldCenter.x,
      y: newCenter.y-oldCenter.y
    };

    var bg = back;
    var transform = L.DomUtil.TRANSFORM;
    bg.style[transform] = L.DomUtil.getTranslateString(origin) +' scale('+ e.scale +') ';
  },

  _endZoomAnim: function () {
    this._animating = false;
    this._canvas.style.display = 'block';
    this._backCanvas.style.display = 'none';
  },

  getCanvas: function() {
    return this._canvas;
  },

  getAttribution: function() {
    return this.options.attribution;
  },

  draw: function() {
    return this._reset();
  },

  onRemove: function (map) {
    this._container.parentNode.removeChild(this._container);
    map.off({
      viewreset: this._reset,
      move:      this.render,
      resize:    this._reset,
      zoomanim:  this._animateZoom,
      zoomend:   this._endZoomAnim
    }, this);
  },

  addTo: function (map) {
    map.addLayer(this);
    return this;
  },

  setOpacity: function(opacity) {
    this.options.opacity = opacity;
    this._updateOpacity();
    return this;
  },

  setZIndex: function(zIndex) {
    this._canvas.style.zIndex = zIndex;
  },

  bringToFront: function() {
    return this;
  },

  bringToBack: function() {
    return this;
  },

  _reset: function() {
    var size = this._map.getSize();
    this._canvas.width = size.x;
    this._canvas.height = size.y;
    this.onResize();
    this.render();
  },

  /*
  _project: function(x) {
    var point = this._map.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
    return [point.x, point.y];
  },
  */

  _updateOpacity: function() {},

  // TODO: create an interval
  redraw: function() {
    if (this.currentAnimationFrame >= 0) {
      this.cancelAnimationFrame.call(window, this.currentAnimationFrame);
    }
    this.currentAnimationFrame = this.requestAnimationFrame.call(window, this.render);
  },

  onResize: function() {},

  render: function() {
    this.options.renderer.render();
  }
});
