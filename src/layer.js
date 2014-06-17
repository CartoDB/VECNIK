
var VECNIK = VECNIK || {};

(function(VECNIK, L) {

  VECNIK.Layer = L.TileLayer.extend({

    initialize: function(url, options) {
      this._renderer = options.renderer;
      this._provider = options.provider;
      L.TileLayer.prototype.initialize.call(this, url, options);
    },

    createTile: function(coords) {
      var tile = new VECNIK.Tile({
        url: this.getTileUrl(coords),
        coords: coords,
        renderer: this._renderer
      });

      return tile.getDomElement();
    },

    getTileUrl: function(coords) {
      return this._provider.getUrl(coords.x, coords.y, coords.z);
    }
  });

})(VECNIK, L);
