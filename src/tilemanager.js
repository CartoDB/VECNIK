
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
  };

  var proto = VECNIK.TileManager.prototype = new VECNIK.Events();

  proto.setZoom = function(zoom) {
    this._mapZoom = zoom;
  },

  proto.update = function(bounds) {
    if (this._mapZoom > this._maxZoom || this._mapZoom < this._minZoom) {
      return;
    }

    var tileSize = this._tileSize;

    var tileBounds = {
      w: bounds.min.x/tileSize <<0,
      n: bounds.min.y/tileSize <<0,
      e: bounds.max.x/tileSize <<0,
      s: bounds.max.y/tileSize <<0
    };

    this._loadTilesFromCenterOut(tileBounds);
    this._removeInvisibleTiles(tileBounds);
  };

  proto._getTileKey = function(tile) {
    return [tile.x, tile.y, tile.zoom].join(',');
  };

  proto._removeInvisibleTiles = function(tileBounds) {
    var tile;
    for (var key in this._tiles) {
      if (this._tiles.hasOwnProperty(key)) {
        tile = this._tiles[key];
        if (tile.zoom !== this._mapZoom || tile.x < tileBounds.w || tile.x > tileBounds.e || tile.y < tileBounds.n || tile.y > tileBounds.s) {
          delete this._tiles[key];
        }
      }
    }

    this._data = [];
    for (key in this._tiles) {
      this._data = this._data.concat(this._tiles[key].data);
    }
    this.emit('change', this._data);
  };

  proto._addTile = function(tile, data) {
    this._convert(tile, data).on('ready', function(tileWithData) {
      this._tiles[ this._getTileKey(tileWithData) ] = tileWithData;
      this._data = this._data.concat(tileWithData.data);
      this.emit('change', this._data);
    }, this);
  };

  proto._tileShouldBeLoaded = function(x, y, zoom) {
    var key = this._getTileKey({ x:x, y:y, zoom:zoom });
    return !(key in this._tiles);
  };

  proto._loadTilesFromCenterOut = function(tileBounds) {
    var
      queue = [],
      x, y,
      tile;

    for (y = tileBounds.n; y <= tileBounds.s; y++) {
      for (x = tileBounds.w; x <= tileBounds.e; x++) {
        if (this._tileShouldBeLoaded(x, y, this._mapZoom)) {
          queue.push({ x:x, y:y, zoom:this._mapZoom });
        }
      }
    }

    var numTilesToLoad = queue.length;
    if (numTilesToLoad === 0) {
      return;
    }

    var center = {
      x: tileBounds.w + (tileBounds.e-tileBounds.w) / 2,
      y: tileBounds.s + (tileBounds.n-tileBounds.s) / 2
    };

    queue.sort(function(a, b) {
      return sqDistance(a, center) - sqDistance(b, center);
    });

    for (var i = 0; i < numTilesToLoad; i++) {
      tile = queue[i];
      VECNIK.load(this._provider.getUrl(tile.x, tile.y, tile.zoom))
        .on('load', (function(tile_) {
          return function(data) {
            this._addTile(tile_, data.features);
          };
        }(tile)), this);
    }
  };

  proto.getData = function() {
    return this._data;
  };

  proto._convert = function(tile, collection) {
    if (VECNIK.settings.get('WEBWORKERS') && typeof Worker !== undefined) {
      var worker = new Worker('../src/projector.worker.js');
      var self = this;
      worker.onmessage = function(e) {
        self.emit('ready', e.data);
      };
      worker.postMessage({ tile:tile, collection:collection, zoom:this._mapZoom });
      return this;
    }

    var
      data = [],
      feature, coordinates;

    for (var i = 0, il = collection.length; i < il; i++) {
      feature = collection[i];
      if (!feature.geometry) {
        continue;
      }

      coordinates = VECNIK.projectGeometry(feature.geometry, this._mapZoom);
      if (!coordinates || !coordinates.length) {
        continue;
      }

      data.push({
        coordinates: coordinates,
        type: feature.geometry.type,
        properties: feature.properties
      });
    }

    tile.data = data;
    this.emit('ready', tile);

    return this;
  };

})(VECNIK);

if (typeof module !== 'undefined' && module.exports) {
  module.exports.TileManager = VECNIK.TileManager;
}
