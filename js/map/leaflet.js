var Layer = function(map) {
  this.offset = { x:0, y:0 };
  map.addLayer(this);
};

var proto = Layer.prototype;

proto.onAdd = function(map) {
  this.map = map;
  Canvas.appendTo(map._panes.overlayPane);

  var
    off = this.getOffset(),
    po = map.getPixelOrigin();
  setSize({ w:map._size.x, h:map._size.y });
  setOrigin({ x:po.x-off.x, y:po.y-off.y });
  setZoom(map._zoom);

  Canvas.setPosition(-off.x, -off.y);

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
    map.attributionControl.addAttribution(ATTRIBUTION);
  }

  Data.update();
};

proto.onRemove = function() {
    var map = this.map;
    if (map.attributionControl) {
        map.attributionControl.removeAttribution(ATTRIBUTION);
    }

    map.off({
        move:      this.onMove,
        moveend:   this.onMoveEnd,
        zoomanim:  this.onZoom,
        zoomend:   this.onZoomEnd,
        viewreset: this.onViewReset
    }, this);

    Canvas.remove();
    map = null;
};

proto.onMove = function(e) {};

proto.onMoveEnd = function(e) {
  if (this.skipMoveEnd) { // moveend is also fired after zoom
    this.skipMoveEnd = false;
    return;
  }
  var
    map = this.map,
    off = this.getOffset(),
    po = map.getPixelOrigin();

  this.offset = off;
  Canvas.setPosition(-off.x, -off.y);

  setSize({ w:map._size.x, h:map._size.y }); // in case this is triggered by resize
  setOrigin({ x:po.x-off.x, y:po.y-off.y });
  onMoveEnd(e);
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
  var
    map = this.map,
    off = this.getOffset(),
    po = map.getPixelOrigin();

  setOrigin({ x:po.x-off.x, y:po.y-off.y });
  onZoomEnd({ zoom:map._zoom });
  this.skipMoveEnd = true;
};

proto.onViewReset = function() {
  var off = this.getOffset();
  this.offset = off;
  Canvas.setPosition(-off.x, -off.y);
};

proto.getOffset = function() {
  return L.DomUtil.getPosition(this.map._mapPane);
};
