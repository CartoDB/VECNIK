
var Vecnik = function(options) {
  this.provider = options.provider;
  this.canvas     = new Vecnik.Canvas();
  this.projection = new Vecnik.Projection();
  this.data       = new Vecnik.Data(this.projection, this.provider);
};

Vecnik.ATTRIBUTION = '&copy; CartoDB Vecnik';
Vecnik.WEBWORKERS  = false;
Vecnik.BACKBUFFER  = true;
Vecnik.TILE_SIZE   = 256;

var proto = Vecnik.prototype;

proto.appendTo = function(container) {
  return this.canvas.appendTo(container);
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
//  this.canvas.setZoom();
};
proto.update = function() {
  this.data.update();
};
proto.setMapSize = function(size) {
  this.projection.setMapSize(size);
};
proto.setOrigin = function(origin) {
  this.projection.setOrigin(origin);
};
proto.getUrl = function(x, y, z) {
  return this.provider.getUrl(x, y, z);
};
//proto.getUrl = function(x, y, z, success, failure) {
//  var url = this.provider.getUrl(x, y, z);
//  new Vecnik.Request(url).on('load', success).on('error', failure);
//};
