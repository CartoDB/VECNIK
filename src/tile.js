
(function(VECNIK) {

  VECNIK.Tile = function(x, y, zoom) {
    this.x = x;
    this.y = y;
    this.zoom = zoom;

    this.on('change', this.cache.bind(this))
  };

  var proto = VECNIK.Tile.prototype = new VECNIK.Model();

  proto.key = function() {
    return [this.x, this.y, this.zoom].join(';');
  };

  proto.geometry = function() {
    return this.get('geometry');
  };

  proto.cache = function() {
    var collection = [];
    var features = this.data.features;

    // TODO: align property handling
//    if (VECNIK.settings.get('WEBWORKERS') && typeof Worker !== undefined) {
//      var worker = new Worker('../src/projector.worker.js');
//      var self = this;
//      worker.onmessage = function(e) {
//        self.set({ geometry: e.data.geometry }, true);
//        self.unset('features', true);
//        self.emit('ready');
//      };
//      worker.postMessage({
//        collection: collection,
//        zoom: this.zoom,
//        x: this.x,
//        y: this.y
//      });
//      return;
//    }

    var feature, coordinates;
    for (var i = 0, il = features.length; i < il; i++) {
      feature = features[i];
      if (!feature.geometry) {
        continue;
      }

      coordinates = VECNIK.projectGeometry(feature.geometry, this.zoom, this.x, this.y);
      if (!coordinates || !coordinates.length) {
        continue;
      }

      collection.push({
        coordinates: coordinates,
        type: feature.geometry.type,
        properties: feature.properties
      });
    }

    this.set({ collection: collection }, true);
    this.unset('features', true);
    this.emit('ready');
  };

})(VECNIK);

if (typeof module !== 'undefined' && module.exports) {
  module.exports.Tile = VECNIK.Tile;
}
