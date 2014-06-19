
var VECNIK = VECNIK || {};

(function(VECNIK, L) {

  VECNIK.Layer = L.TileLayer.extend({

    options: {
      maxZoom: 20
    },

    initialize: function(options) {
      // applies to a single tile but we don'T want to check on per tile basis
      if (!options.provider) {
        throw new Error('VECNIK.Tile requires a data provider');
      }
      this._provider = options.provider;

      // TODO: use internal renderer as default
      // applies to a single tile but we don'T want to check on per tile basis
      if (!options.renderer) {
        throw new Error('VECNIK.Tile requires a renderer');
      }
      this._renderer = options.renderer;

      L.TileLayer.prototype.initialize.call(this, '', options);
    },

    createTile: function(coords) {
      var tile = new VECNIK.Tile({
        coords: coords,
        provider: this._provider,
        renderer: this._renderer
      });

      return tile.getDomElement();
    }
  });

})(VECNIK, L);
