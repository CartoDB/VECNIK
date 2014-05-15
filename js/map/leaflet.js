
L.VecnikLayer = function(map, options) {
  this.vecnik = new Vecnik(options);
  map.addLayer(this);
};

var proto = L.VecnikLayer.prototype;

proto.onAdd = function(map) {
  this.map = map;
  this.vecnik.append(map._panes.overlayPane);

  this.vecnik.setSize({ width:map._size.x, height:map._size.y });
  this.vecnik.setMapSize = Vecnik.TILE_SIZE <<map.getZoom();
  this.vecnik.setOrigin = map.getPixelOrigin();
  this.vecnik.setOffset(this.getOffset());

  map.on({
    move:      this.onMove,
    moveend:   this.onMoveEnd,
    zoomanim:  this.onZoom,
    zoomend:   this.onZoomEnd,
    viewreset: this.onViewReset
  }, this);

  if (map.options.zoomAnimation) {
    map.on('zoomanim', this.onZoom, this);
  }

  if (map.attributionControl) {
    map.attributionControl.addAttribution(Vecnik.ATTRIBUTION);
  }

  this.vecnik.update();
};

proto.onRemove = function() {
  var map = this.map;
  if (map.attributionControl) {
    map.attributionControl.removeAttribution(Vecnik.ATTRIBUTION);
  }

  map.off({
    move:      this.onMove,
    moveend:   this.onMoveEnd,
    zoomanim:  this.onZoom,
    zoomend:   this.onZoomEnd,
    viewreset: this.onViewReset
  }, this);

  this.vecnik.remove();
  map = null;
};

proto.onMove = function(e) {
  this.vecnik.setOffset(this.getOffset());
  this.vecnik.update();
};

proto.onMoveEnd = function(e) {
//  var map = this.map;
  this.vecnik.setOffset(this.getOffset());
//this.vecnik.setSize({ width:map._size.x, height:map._size.y }); // in case this is triggered by resize
  this.vecnik.update();
};

proto.onZoom = function(e) {
//    var map = this.map,
//        scale = map.getZoomScale(e.zoom),
//        offset = map._getCenterOffset(e.center).divideBy(1 - 1/scale),
//        viewportPos = map.containerPointToLayerPoint(map.getSize().multiplyBy(-1)),
//        origin = viewportPos.add(offset).round();
//
//    this.container.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString((origin.multiplyBy(-1).add(this.getOffset().multiplyBy(-1)).multiplyBy(scale).add(origin))) + ' scale(' + scale + ') ';
};

proto.onZoomEnd = function(e) {
  var map = this.map;
  this.vecnik.projection.origin = map.getPixelOrigin();
  this.vecnik.setZoom(map._zoom);
  this.vecnik.setMapSize = Vecnik.TILE_SIZE <<e.zoom;
  this.vecnik.update();
};

proto.onViewReset = function() {
  this.vecnik.setOffset(this.getOffset());
};

proto.getOffset = function() {
  return L.DomUtil.getPosition(this.map._mapPane);
};

L.vecnikLayer = function(map, options) {
  return new L.VecnikLayer(map, options);
};
