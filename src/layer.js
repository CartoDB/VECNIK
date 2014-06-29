
// do this only when Leaflet exists (aka don't when run in web worker)
if (typeof L !== 'undefined') {
  var Tile = require('./tile');

  var Layer = module.exports = L.TileLayer.extend({

    options: {
      maxZoom: 20
    },

    initialize: function(options) {
      // applies to a single tile but we don't want to check on per tile basis
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
      var tile = new Tile({
        coords: coords,
        provider: this._provider,
        renderer: this._renderer
      });

      return tile.getDomElement();
    }
  });
}
