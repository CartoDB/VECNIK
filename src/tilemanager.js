
(function(VECNIK) {

  VECNIK.TileManager = function(options) {
    VECNIK.Events.prototype.constructor.call(this);

    if (!options.provider) {
      throw new Error('TileManager requires a provider');
    }

    this._provider = options.provider;
    this._tileSize = options.tileSize;
    this._minZoom = this.options.minZoom || 0;
    this._maxZoom = this.options.maxZoom || 20;

//  this._data = [];
    this._tiles = {};
    this._tilesLoading = {};
    this._numTilesToLoad = 0;

    this.update();
  };

  var proto = VECNIK.TileManager.prototype;

  proto.update = function() {
    var
      bounds = this._bounds,
      tileSize = this._tileSize;

    if (this._mapZoom > this._maxZoom || this._mapZoom < this._minZoom) {
      return;
    }

    var tileBounds = {
      w: bounds.w/tileSize <<0,
      n: bounds.n/tileSize <<0,
      e: bounds.e/tileSize <<0,
      s: bounds.s/tileSize <<0
    };

    this._addTilesFromCenterOut(tileBounds);
    this._removeInvisibleTiles(tileBounds);
  };

  proto._removeAllTiles = function() {
    for (var key in this._tiles) {
      this._removeTile(key);
    }
  };

  proto._removeInvisibleTiles = function(tileBounds) {
    var tile;
    for (var key in tiles) {
      if (this._tiles.hasOwnProperty(key)) {
        tile = this._tiles[key];
        if (tile.zoom !== this._mapZoom || tile.x < tileBounds.w || tile.x > tileBounds.e || tile.y < tileBounds.n || tile.y > tileBounds.s) {
          this._removeTile(key);
        }
      }
    }
  };

  proto._removeTile = function(key) {
    delete this._tiles[key];
    delete this._tilesLoading[key];
// tile.destroy();
// TODO rebuild the buffers
  },

  proto._tileShouldBeLoaded = function(x, y, zoom) {
//    var key = this._getKey(x, y, zoom);
    return !(key in this._tiles) && !(key in this._tilesLoading);
  };

  proto._onTileLoad = function(tile) {
    this._numTilesToLoad--;
    var key = tile.getKey();
    this._tiles[key] = tile;
    delete this._tilesLoading[key];
    if (!this._numTilesToLoad) {
      // EMIT tilesLoaded?
    }
  };

  proto._addTilesFromCenterOut = function(tileBounds) {
    var queue = [], x, y;
    for (y = this._bounds.n; y <= this._bounds.s; y++) {
      for (x = this._bounds.w; x <= this._bounds.e; x++) {
        if (this._tileShouldBeLoaded(x, y, this._mapZoom)) {

          new VECNIK.Tile(x, y, this._mapZoom)
            .on('ready', function() {
//              this._data = this._data.concat(tile._data);
            }, this);

          queue.push(tile);
        }
      }
    }

    var numTilesToLoad = queue.length;
    if (numTilesToLoad === 0) {
      return;
    }

    this._numTilesToLoad += numTilesToLoad;

//    var center = this._bounds.getCenter();
//    queue.sort(function (a, b) {
//      return a.distanceTo(center) - b.distanceTo(center);
//    });

    var tile, key;
    for (var i = 0; i < numTilesToLoad; i++) {
      tile = queue[i];
      key = tile.getKey();
      this._tilesLoading[key] = tile;
      VECNIK.load(this._provider.getUrl(tile.x, tile.y, tile.zoom))
        .on('load', function(data) {
          tile.setData(data);
          this._onTileLoad(tile);
        }, this);
    }
    // EMIT tilesLoading?
  };
})(VECNIK);

if (typeof module !== 'undefined' && module.exports) {
  module.exports.TileManager = VECNIK.TileManager;
}
