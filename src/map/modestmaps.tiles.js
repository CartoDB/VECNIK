
(function(VECNIK) {

  VECNIK.TileManager = function(provider) {
    this.tiles = {};
    this.provider = provider;
  };

  var proto = TileManager.prototype;

  proto.tileIndex = function(coordinates) {
    return coordinates.toKey();
  };

  proto.get = function(coordinates) {
    return this.tiles[this.tileIndex(coordinates)];
  };

  proto.destroy = function(coordinates) {
    var tile = this.tiles[this.tileIndex(coordinates)];
    if (tile) {
      tile.destroy();
      delete this.tiles[this.tileIndex(coordinates)];
    }
  };

  proto.add = function(coordinates) {
    var tile = this.tiles[this.tileIndex(coordinates)] = new VECNIK.Tile(
        coordinates.column,
        coordinates.row,
        coordinates.zoom
    );

    VECNIK.load(this.provider.getUrl(coordinates.column, coordinates.row, coordinates.zoom), function(data) {
        tile.set(data);
    });

    return tile;
  };

})(VECNIK);

if (typeof module !== 'undefined' && module.exports) {
  module.exports.TileManager = VECNIK.TileManager;
}
