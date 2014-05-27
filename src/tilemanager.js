
(function(VECNIK) {

  function sqDistance(a, b) {
    var dx = a.x-b.x, dy = a.y-b.y;
    return dx*dx + dy*dy;
  }

  VECNIK.TileManager = function(options) {
    VECNIK.Events.prototype.constructor.call(this);

    if (!options.provider) {
      throw new Error('TileManager requires a provider');
    }

    this._provider = options.provider;
    this._tileSize = options.tileSize || 256;
    this._minZoom  = options.minZoom || 0;
    this._maxZoom  = options.maxZoom || 20;

    this._data = [];
    this._mapZoom = 0;

    this._tiles = {};
    this._tilesLoading = {};
    this._numTilesToLoad = 0;
  };

  var proto = VECNIK.TileManager.prototype = new VECNIK.Events();

  proto.setZoom = function(zoom) {
    this._mapZoom = zoom;
  },

  proto.update = function(bounds) {
    var tileSize = this._tileSize;

    if (this._mapZoom > this._maxZoom || this._mapZoom < this._minZoom) {
      return;
    }

    var tileBounds = {
      w: bounds.min.x/tileSize <<0,
      n: bounds.min.y/tileSize <<0,
      e: bounds.max.x/tileSize <<0,
      s: bounds.max.y/tileSize <<0
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
    for (var key in this._tiles) {
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
// TODO: rebuild the buffers URGENT!
    this.emit('change', this._data);
  },

  proto._tileShouldBeLoaded = function(x, y, zoom) {
    var key = VECNIK.Tile.getKey(x, y, zoom);
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
    var queue = [], x, y, tile;

    for (y = tileBounds.n; y <= tileBounds.s; y++) {
      for (x = tileBounds.w; x <= tileBounds.e; x++) {
        if (this._tileShouldBeLoaded(x, y, this._mapZoom)) {
          tile = new VECNIK.Tile(x, y, this._mapZoom)
            .on('ready', function() {
              // TODO: refactor for proper access
              this._data = this._data.concat(tile._data);
//              (id[])
//              type[]
//              properties[{}]
//              coordinates[]
              this.emit('change', this._data);
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

    var center = {
      x: (tileBounds.e-tileBounds.w) / 2,
      y: (tileBounds.n-tileBounds.s) / 2
    };

    queue.sort(function(a, b) {
      return sqDistance(a, center) - sqDistance(b, center);
    });

    var key;
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
