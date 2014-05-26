
(function(VECNIK) {

  VECNIK.TileManager = function(provider) {
    VECNIK.Events.prototype.constructor.call(this);

    this._tiles = {};

    if (!provider) {
      throw new Error('TileManager requires a provider');
    }

    this._provider = provider;
  };

  var proto = VECNIK.TileManager.prototype = new VECNIK.Events();

  proto.getTile = function(key) {
    return this._tiles[key];
  };

  proto.destroyTile = function(key) {
    var tile = this._tiles[key];
    if (tile) {
      tile.destroy();
      delete this._tiles[key];
    }
  };

  proto.add = function(x, y, zoom) {
    var tile = new VECNIK.Tile(x, y, zoom);
    this._tiles[tile.getKey()] = tile;

    VECNIK.load(this._provider.getUrl(x, y, zoom))
      .on('load', function(data) {
        tile.setData(data);
        this.emit('tileloaded', tile);
      }, this);

    return tile;
  };

})(VECNIK);

if (typeof module !== 'undefined' && module.exports) {
  module.exports.TileManager = VECNIK.TileManager;
}
