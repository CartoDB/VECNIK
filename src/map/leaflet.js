
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

    this._canvas = this._createCanvas();
    this.options.renderer.setCanvas(this._canvas);

    // backCanvas for zoom animation
    this._backCanvas = this._createCanvas();

    requestAnimationFrame(this.render.bind(this));
  },

  _createCanvas: function() {
    var canvas;
    canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.style.pointerEvents = 'none';
    canvas.style.webkitTransform = 'translate3d(0,0,0)'; // turn on hw acceleration
    canvas.style.imageRendering  = 'optimizeSpeed';
    canvas.style.zIndex = this.options.zIndex || 0;
    canvas.setAttribute('class', 'leaflet-tile-container leaflet-zoom-animated');
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
      resize:    this._reset,
      zoomanim:  this._animateZoom,
      zoomend:   this._endZoomAnim
    }, this);

    var self = this;
    this.on('tileAdded', function(coords) {
      VECNIK.load(this.options.provider.getUrl(coords.x, coords.y, coords.zoom), function(data) {
        var tile = new VECNIK.Tile(coords.x, coords.y, coords.zoom);
        tile.set(data);
        self._tileLoaded(coords, tile);
      });
    });

    this._initTileLoader(); // has to be called after on(tileAdded) in order to have event listeners ready TODO: refactor this
    this._reset();
  },

  _animateZoom: function(e) {
    if (!this._animating) {
      this._animating = true;
    }
    var back = this._backCanvas;

    back.width = this._canvas.width;
    back.height = this._canvas.height;

    // paint current canvas in back canvas with transformation
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
  },

  /*
  _project: function(x) {
    var point = this._map.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
    return [point.x, point.y];
  },
  */

  _updateOpacity: function() {},

  redraw: function() {},

  onResize: function() {},

  render: function() {
    // TODO: turn tile data into a single render queue
    // TODO: all coordinates as buffers
    this.options.renderer.clear();
    for (var key in this._tiles) {
      this.options.renderer.render(this._tiles[key].get('collection'));
    }

    requestAnimationFrame(this.render.bind(this));
  }
});
