
(function(VECNIK) {

  VECNIK.Tile = function(x, y, zoom) {
    VECNIK.Events.prototype.constructor.call(this);
    this.x = x;
    this.y = y;
    this.zoom = zoom;
  };

  VECNIK.Tile.getKey = function(x, y, zoom) {
    return [x, y, zoom].join(',');
  };

  var proto = VECNIK.Tile.prototype = new VECNIK.Events();

  proto.getKey = function() {
    return VECNIK.Tile.getKey(this.x, this.y, this.zoom);
  };

  proto.setData = function(data) {
// TODO: enable this if Leaflet should handle projection
//this.emit('ready', data.features);
//return;
    this._convert(data.features);
  };

  proto._convert = function(collection) {
    this._data = [];

    if (VECNIK.settings.get('WEBWORKERS') && typeof Worker !== undefined) {
      var worker = new Worker('../src/projector.worker.js');
      var self = this;
      worker.onmessage = function(e) {
        self._data = e.data;
        self.emit('ready', self._data);
      };
      worker.postMessage({
        collection: collection,
        zoom: this.zoom
      });
      return;
    }

    var feature, coordinates;
    for (var i = 0, il = collection.length; i < il; i++) {
      feature = collection[i];
      if (!feature.geometry) {
        continue;
      }

      coordinates = VECNIK.projectGeometry(feature.geometry, this.zoom);
      if (!coordinates || !coordinates.length) {
        continue;
      }

      this._data.push({
        coordinates: coordinates,
        type: feature.geometry.type,
        properties: feature.properties
      });
    }

    this.emit('ready', this._data);
  };

})(VECNIK);

if (typeof module !== 'undefined' && module.exports) {
  module.exports.Tile = VECNIK.Tile;
}
