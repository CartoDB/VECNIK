L.Mixin.TileLoader = {

  _initTileLoader: function() {
    this._tiles = {};
    this._tilesLoading = {};
    this._tilesToLoad = 0;
    this._map.on('moveend', this._updateTiles, this);
    this._updateTiles();
  },

  _removeTileLoader: function() {
    this._map.off('moveend', this._updateTiles, this);
    this._removeTiles();
  },

  _updateTiles: function() {
    if (!this._map) {
      return;
    }

    var
      bounds = this._map.getPixelBounds(),
      zoom = this._map.getZoom(),
      tileSize = this.options.tileSize;

    if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
      return;
    }

    var
      nwTilePoint = new L.Point(
        bounds.min.x / tileSize <<0,
        bounds.min.y / tileSize <<0
      ),
       seTilePoint = new L.Point(
        bounds.max.x / tileSize <<0,
        bounds.max.y / tileSize <<0
      ),
      tileBounds = new L.Bounds(nwTilePoint, seTilePoint);

    this._geometryOrigin = bounds.min;
    this._addTilesFromCenterOut(tileBounds);
    this._removeOtherTiles(tileBounds);
  },

  _removeTiles: function(bounds) {
    for (var key in this._tiles) {
      this._removeTile(key);
    }
  },

  _reloadTiles: function() {
    this._removeTiles();
    this._updateTiles();
  },

  _removeOtherTiles: function(bounds) {
    var kArr, x, y, z, key;
    var zoom = this._map.getZoom();

    for (key in this._tiles) {
      if (this._tiles.hasOwnProperty(key)) {
        kArr = key.split(':');
        x = parseInt(kArr[0], 10);
        y = parseInt(kArr[1], 10);
        z = parseInt(kArr[2], 10);

        // remove tile if it's out of bounds
        if (zoom !== z || x < bounds.min.x || x > bounds.max.x || y < bounds.min.y || y > bounds.max.y) {
          this._removeTile(key);
        }
      }
    }
  },

  _removeTile: function(key) {
    this.fire('tileRemoved', this._tiles[key]);
    delete this._tiles[key];
    delete this._tilesLoading[key];
  },

  _tileKey: function(tilePoint) {
    return tilePoint.x +':'+ tilePoint.y +':'+ tilePoint.zoom;
  },

  _tileShouldBeLoaded: function(tilePoint) {
    var k = this._tileKey(tilePoint);
    return !(k in this._tiles) && !(k in this._tilesLoading);
  },

  _tileLoaded: function(coords, tile) {
    this._tilesToLoad--;
    var key = coords.x +':'+ coords.y +':'+ coords.zoom;
    this._tiles[key] = tile;
    delete this._tilesLoading[key];
    if (this._tilesToLoad === 0) {
      this.fire('tilesLoaded');
    }
  },

  getTilePos: function() {},

  _addTilesFromCenterOut: function(bounds) {
    var
      queue = [],
      center = bounds.getCenter(),
      zoom = this._map.getZoom();

    var j, i, point;

    for (j = bounds.min.y; j <= bounds.max.y; j++) {
      for (i = bounds.min.x; i <= bounds.max.x; i++) {
        point = new L.Point(i, j);
        point.zoom =  zoom;
        if (this._tileShouldBeLoaded(point)) {
          queue.push(point);
        }
      }
    }

    var tilesToLoad = queue.length;

    if (tilesToLoad === 0) {
      return;
    }

    // load tiles in order of their distance to center
    queue.sort(function (a, b) {
      return a.distanceTo(center) - b.distanceTo(center);
    });

    this._tilesToLoad += tilesToLoad;

    var tile, key;
    for (i = 0; i < tilesToLoad; i++) {
      tile = queue[i];
      key = this._tileKey(tile);
      this._tilesLoading[key] = tile;
      this.fire('tileAdded', tile);
    }

    this.fire('tilesLoading');
  }
};
