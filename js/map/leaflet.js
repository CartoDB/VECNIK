
L.VecnikLayer = L.TileLayer.extend({

	options: {
    attribution: Vecnik.ATTRIBUTION
	},

  initialize: function(options) {
    L.TileLayer.prototype.initialize.call(this, options);
    this._vecnik = new Vecnik(options);
	},

	onAdd: function(map) {
    this._map = map;

		this._initContainer();

    this._vecnik.setSize({ width:this._map._size.x, height:this._map._size.y });
    this._vecnik.setMapSize(Vecnik.TILE_SIZE <<this._map.getZoom());
    this._vecnik.setOrigin(this._map.getPixelOrigin());
    this._vecnik.setOffset(this._getOffset());

    this._map.on({
      move:      this._onMove,
      moveend:   this._onMoveEnd,
      zoomanim:  this._onZoom,
      zoomend:   this._onZoomEnd,
      viewreset: this._onViewReset
//		viewreset: this._reset,
//		moveend: this._update
    }, this);

		this._reset();
		this._update();
	},

	onRemove: function() {
    this._map.off({
      move:      this._onMove,
      moveend:   this._onMoveEnd,
      zoomanim:  this._onZoom,
      zoomend:   this._onZoomEnd,
      viewreset: this._onViewReset
//		viewreset: this._reset,
//		moveend: this._update
    }, this);

    this._vecnik.remove();

		this._container = null;
    this._map = null;
	},

	_initContainer: function () {
		if (!this._container) {
//    this._container = this._vecnik.appendTo(this._map._panes.overlayPane);
      this._container = this._vecnik.appendTo(this._map._panes.tilePane);
			this._updateZIndex();
			if (this.options.opacity < 1) {
				this._updateOpacity();
			}
		}
	},

	_updateOpacity: function() {
    L.DomUtil.setOpacity(this._container, this.options.opacity);
	},

	_reset: function(e) {
		for(var key in this._tiles) {
			this.fire('tileunload', { tile: this._tiles[key] });
		}

		this._tiles = {};
		this._tilesToLoad = 0;

		if (this.options.reuseTiles) {
			this._unusedTiles = [];
		}

//	TODO: this._vecnik.clear();
	},

	_createTile: function () {
//		var tile = L.DomUtil.create('img', 'leaflet-tile');
		return {};
	},

	_addTile: function(tilePoint) {
//	var tilePos = this._getTilePos(tilePoint);
		// get unused tile - or create a new tile
		var tile = this._getTile();

		/*
		Chrome 20 layouts much faster with top/left (verify with timeline, frames)
		Android 4 browser has display issues with top/left and requires transform instead
		(other browsers don't currently care) - see debug/hacks/jitter.html for an example
		*/
		this._tiles[tilePoint.x +':'+ tilePoint.y] = tile;
		this._loadTile(tile, tilePoint);

    // TODO: add to vecnik data
	},

	_removeTile: function (key) {
		var tile = this._tiles[key];
		this.fire('tileunload', { tile: tile, url: tile.src });
  	this._unusedTiles.push(tile);
		delete this._tiles[key];
	},

	_loadTile: function (tile, tilePoint) {
		tile._layer  = this;

		this._adjustTilePoint(tilePoint);
    tile.src = this._vecnik.getUrl(tilePoint.x, tilePoint.y, tilePoint.z)
tile.src = 'http://pluto.cartodb.com/api/v2/sql?q=select%20cartodb_id%2C%22the_geom%22%20as%20the_geom%20from%20mn_mappluto_13v1%20WHERE%20the_geom%20%26%26%20ST_MakeEnvelope(-73.9599609375%2C40.68063802521456%2C-73.93798828125%2C40.697299008636755%2C%204326)&format=geojson';

    new Vecnik.Request(tile.src).on('load', this._tileOnLoad, tile).on('error', this._tileOnError, tile);
		this.fire('tileloadstart', { tile: tile, url: tile.src });
	},

  _tileOnLoad: function () {
		var layer = this._layer;
    layer.fire('tileload', { tile: this, url: this.src });
		layer._tileLoaded();
	},

	_tileOnError: function () {
		var layer = this._layer;
		layer.fire('tileerror', { tile: this, url: this.src });
		layer._tileLoaded();
	},


	_tileLoaded: function () {
		this._tilesToLoad--;
		if (!this._tilesToLoad) {
			this.fire('load');
		}
	},

  _addTilesFromCenterOut: function(bounds) {
		var queue = [],
		    center = bounds.getCenter();

		var j, i, point;

		for (j = bounds.min.y; j <= bounds.max.y; j++) {
			for (i = bounds.min.x; i <= bounds.max.x; i++) {
				point = new L.Point(i, j);

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

		// if its the first batch of tiles to load
		if (!this._tilesToLoad) {
			this.fire('loading');
		}

		this._tilesToLoad += tilesToLoad;

		for (i = 0; i < tilesToLoad; i++) {
			this._addTile(queue[i]);
		}
	},



  _onMove: function(e) {
    this._vecnik.setOffset(this._getOffset());
  },

  _onMoveEnd: function(e) {
  //  var map = this._map;
    this._vecnik.setOffset(this._getOffset());
  //this._vecnik.setSize({ width:map._size.x, height:map._size.y }); // in case this is triggered by resize
  },

  _onZoom: function(e) {
  //    var map = this._map,
  //        scale = map.getZoomScale(e.zoom),
  //        offset = map._getCenterOffset(e.center).divideBy(1 - 1/scale),
  //        viewportPos = map.containerPointToLayerPoint(map.getSize().multiplyBy(-1)),
  //        origin = viewportPos.add(offset).round();
  //
  //    this.container.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString((origin.multiplyBy(-1).add(this._getOffset().multiplyBy(-1)).multiplyBy(scale).add(origin))) + ' scale(' + scale + ') ';
  },

  _onZoomEnd: function(e) {
    var map = this._map;
    this._vecnik.setOrigin(map.getPixelOrigin());
    this._vecnik.setZoom(map._zoom);
    this._vecnik.setMapSize(Vecnik.TILE_SIZE <<e.zoom);
  },

  _onViewReset: function() {
    this._vecnik.setOffset(this._getOffset());
  },

  _getOffset: function() {
    return L.DomUtil.getPosition(this._map._mapPane);
  }
});

L.vecnikLayer = function(map, options) {
  return new L.VecnikLayer(map, options);
};
