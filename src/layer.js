
// do this only when Leaflet exists (aka don't when run in web worker)
if (L && L.TileLayer) {
  var Tile = require('./tile');
  var Profiler = require('./profiler');

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
      this.tiles = {};

      L.TileLayer.prototype.initialize.call(this, '', options);
    },

    _removeTile: function(key) {
      delete this.tiles[key];
      L.TileLayer.prototype._removeTile.call(this, key);
    },

    createTile: function(coords) {
      var tile = new Tile({
        coords: coords,
        provider: this._provider,
        renderer: this._renderer
      });

      var key = this._tileCoordsToKey(coords);
      this.tiles[key] = tile;

      return tile.getDomElement();
    },

    redraw: function() {
      var timer = Profiler.metric('tiles.render.time').start();
      for(var k in this.tiles) {
        this.tiles[k].render();
      }
      timer.end();
    }
  });
}
