
L.CanvasLayer = L.Class.extend({

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

    // TODO: use internal renderer as default
    if (!this.options.renderer) {
      throw new Error('CanvasLayer requires a renderer');
    }

    this._renderer = this.options.renderer;

    this._canvas = this._createCanvas();
    this._renderer.setCanvas(this._canvas);

    // backCanvas for zoom animation
    this._backCanvas = this._createCanvas();
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

  onAdd: function(e) {
    // for Leaflet 0.8 compatibility
    this._map = e.target ? e.target : e;

    // add container with the canvas to the tile pane
    // the container is moved in the oposite direction of the
    // map pane to keep the canvas always in (0, 0)

    var self = this;

    var mapPane = this._map._panes.tilePane;
    var container = L.DomUtil.create('div', 'leaflet-layer');
    container.appendChild(this._canvas);
    container.appendChild(this._backCanvas);
    this._backCanvas.style.display = 'none';
    mapPane.appendChild(container);

    this._container = container;

    this._map.on({
      viewreset: this._reset,
      resize:    this._reset,
      moveend: function() {
        requestAnimationFrame(function() {
//        var d = this._map.dragging._draggable;
//        L.DomUtil.setPosition(container, { x: -d._newPos.x, y: -d._newPos.y });
          L.DomUtil.setPosition(container, L.DomUtil.getPosition(self._map._mapPane).multiplyBy(-1));
        });
      },
      zoomanim:  this._animateZoom,
      zoomend:   this._endZoomAnim
    }, this);

    //*** TileManager Adapter *************************************************

    // TODO: add proper destroy() methods
    var tileManager = new VECNIK.TileManager({
      provider: this.options.provider,
      tileSize: this.options.tileSize,
      minZoom:  this.options.minZoom,
      maxZoom:  this.options.maxZoom
    });

    // TODO: there should be updates during move as well

    this._map.on('moveend', function() {
      tileManager.update(this._map.getPixelBounds())
    }, this);

    this._map.on('zoomend', function() {
      tileManager.setZoom(this._map.getZoom())
    }, this);

    tileManager.setZoom(this._map.getZoom());
    tileManager.update(this._map.getPixelBounds());

self._geojson = L.geoJson().addTo(self._map);

    tileManager.on('change', function(tileData) {
      // TODO: turn tile data into a single render queue
      // TODO: all coordinates as buffers
      // TODO: consider drawing tile by tile as they arrive
      var renderer = this._renderer;
      requestAnimationFrame(function() {
//      renderer.render(tileData, self._map.getPixelBounds().min);
        self._geojson.clearLayers();
        self._geojson.addData(tileData);
      });
    }, this);

    //*************************************************************************

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

  onResize: function() {}

});

// for Leaflet 0.8 compatibility
L.CanvasLayer.prototype._layerAdd    = L.CanvasLayer.prototype.onAdd;
L.CanvasLayer.prototype._layerRemove = L.CanvasLayer.prototype.onRemove;

