
// TODO: refactor tiles to be simpler structure
// TODO: fix projection origin per tile
// TODO: add geometries into a render queue
// TODO: filter duplicate features

(function(VECNIK) {

  VECNIK.Tile = function(x, y, zoom) {
    VECNIK.Model.prototype.constructor.call(this);
    this._x = x;
    this._y = y;
    this._zoom = zoom;
  };

  var proto = VECNIK.Tile.prototype = new VECNIK.Model();

  proto.getKey = function() {
    return [this._x, this._y, this._zoom].join(';');
  };

  proto.setData = function(data) {
    this._features = data.features;
    this._collection = this._convert(this._features);
  };

  proto.geometry = function() {
    return this.get('geometry');
  };

  proto._convert = function(features) {
    var collection = [];

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
//        zoom: this._zoom,
//        x: this._x,
//        y: this._y
//      });
//      return;
//    }

    var feature, coordinates;
    for (var i = 0, il = features.length; i < il; i++) {
      feature = features[i];
      if (!feature.geometry) {
        continue;
      }

      coordinates = VECNIK.projectGeometry(feature.geometry, this._zoom);
      if (!coordinates || !coordinates.length) {
        continue;
      }

      collection.push({
        coordinates: coordinates,
        type: feature.geometry.type,
        properties: feature.properties
      });
    }

    this.emit('ready', collection);
    return collection;
  };

})(VECNIK);

if (typeof module !== 'undefined' && module.exports) {
  module.exports.Tile = VECNIK.Tile;
}
