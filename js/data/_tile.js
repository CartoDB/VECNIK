function Tile(x, y, zoom) {
  this.x = x;
  this.y = y;
  this.zoom = zoom;
  this.on('change', this.precache.bind(this))
}

Tile.prototype = new VECNIK.Model();

Tile.prototype.key = function() {
  return [this.x, this.y, this.zoom].join('-');
};

Tile.prototype.geometry = function() {
  return this.get('geometry');
};

Tile.prototype.precache = function() {
  var self = this;
  var geometry = [];
  var primitives = this.data.features;
  if(VECNIK.settings.get('WEBWORKERS') && typeof Worker !== undefined) {
    var worker = new Worker('../js/projector.worker.js');
    worker.onmessage = function(ev) {
      self.set({geometry: ev.data.geometry}, true);
      self.unset('features', true);
      self.emit('geometry_ready');
    };
    worker.postMessage({
      primitives: primitives,
      zoom: this.zoom,
      x: this.x,
      y: this.y
    });
  } else {
    for (var i = 0; i < primitives.length; ++i) {
      var p = primitives[i];
      if(p.geometry) {
        var converted = VECNIK.project_geometry(p.geometry, this.zoom, this.x, this.y);
        if(converted && converted.length !== 0) {
           geometry.push({
             vertexBuffer: converted,
             type: p.geometry.type,
             metadata: p.properties
           });
        } else {
           delete p.geometry.coordinates;
        }
      }
    }
    this.set({geometry: geometry}, true);
    this.unset('features', true);
    this.emit('geometry_ready');
  }
};
