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
        renderer: this._renderer
      });

      return tile.getDomElement();
    },

    getTileUrl: function(coords) {
//    x: coords.x,
//    y: coords.y,
//    z: this._getZoomForUrl()
      return this._provider.getUrl(coords);
    }
  });

})(VECNIK, L);
