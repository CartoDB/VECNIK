
L = L || {};

L.VecnikLayer = function(map) {
  this.canvas = new Vecnik.Canvas;
  this.offset = { x:0, y:0 };
  map.addLayer(this);
};

var proto = L.VecnikLayer.prototype = new Vecnik.Event();

proto.onAdd = function(map) {
  this.map = map;
  this.canvas.appendTo(map._panes.overlayPane);

  var
    off = this.getOffset(),
    po = map.getPixelOrigin();

  this.canvas.setSize({ w:map._size.x, h:map._size.y });
//  this.canvas.setOrigin({ x:po.x-off.x, y:po.y-off.y });
//  this.canvas.setZoom(map._zoom);
  this.canvas.setPosition(-off.x, -off.y);

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

  Vecnik.Data.update();
};

proto.onRemove = function() {
  // TODO: emit here
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

  this.canvas.remove();
  map = null;
};

proto.onMove = function(e) {
  var off = this.getOffset();
  this.canvas.setPosition(-off.x, -off.y);
};

proto.onMoveEnd = function(e) {
  // TODO: emit here
  if (this.skipMoveEnd) { // moveend is also fired after zoom
    this.skipMoveEnd = false;
    return;
  }
  var
    map = this.map,
    off = this.getOffset(),
    po = map.getPixelOrigin();

  this.offset = off;
  this.canvas.setPosition(-off.x, -off.y);
  this.canvas.setSize({ w:map._size.x, h:map._size.y }); // in case this is triggered by resize
//  this.canvas.setOrigin({ x:po.x-off.x, y:po.y-off.y });
  Vecnik.Data.update();
};

proto.onZoom = function(e) {
  // TODO: emit here
//    var map = this.map,
//        scale = map.getZoomScale(e.zoom),
//        offset = map._getCenterOffset(e.center).divideBy(1 - 1/scale),
//        viewportPos = map.containerPointToLayerPoint(map.getSize().multiplyBy(-1)),
//        origin = viewportPos.add(offset).round();
//
//    this.container.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString((origin.multiplyBy(-1).add(this.getOffset().multiplyBy(-1)).multiplyBy(scale).add(origin))) + ' scale(' + scale + ') ';
};

proto.onZoomEnd = function(e) {
  // TODO: emit here
  var
    map = this.map,
    off = this.getOffset(),
    po = map.getPixelOrigin();

  this.canvas.setOrigin({ x:po.x-off.x, y:po.y-off.y });
  this.canvas.onZoomEnd({ zoom:map._zoom });
  this.skipMoveEnd = true;

//  setZoom(e.zoom);
  Vecnik.Data.update();
};

proto.onViewReset = function() {
  // TODO: emit here
  var off = this.getOffset();
  this.offset = off;
//  this.canvas.setPosition(-off.x, -off.y);
};

proto.getOffset = function() {
  return L.DomUtil.getPosition(this.map._mapPane);
};
