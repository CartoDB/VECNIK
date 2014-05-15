
var Vecnik = function(options) {
  this.canvas     = new Vecnik.Canvas();
  this.projection = new Vecnik.Projection();
  this.data       = new Vecnik.Data(this.projection);
};

Vecnik.ATTRIBUTION = '&copy; CartoDB Vecnik';

Vecnik.WEBWORKERS = false;
Vecnik.BACKBUFFER = true;

Vecnik.ENABLE_SIMPLIFY = true;
Vecnik.ENABLE_SNAPPING = true;
Vecnik.ENABLE_CLIPPING = true;
Vecnik.ENABLE_FIXING   = true;

Vecnik.TILE_SIZE = 256;

var proto = Vecnik.prototype;

proto.append = function(container) {
  this.canvas.append(container);
};
proto.remove = function() {
  this.canvas.remove();
};
proto.setOffset = function(offset) {
  this.canvas.setPosition(offset);
};
proto.setSize = function(size) {
  this.canvas.setSize(size);
};
proto.setZoom = function(zoom) {
  this.canvas.setZoom();
};
proto.update = function() {
  this.data.update();
};
proto.setMapSize = function(size) {
  this.projection.mapSize(size);
};
proto.setOrigin = function(origin) {
  this.projection.origin(origin);
};
