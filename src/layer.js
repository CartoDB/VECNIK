
var VECNIK = require('./core/core');
var Geometry = require('./geometry');

// do this only when Leaflet exists (aka don't when run in web worker)
if (typeof L !== 'undefined') {
  var Tile = require('./tile');
  var Profiler = require('./profiler');

  var Layer = module.exports = L.TileLayer.extend({

    options: {
      maxZoom: 22
    },

    _renderQueue: [],

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

      this._tileObjects = {};
      this._centroidPositions = {};

      var self = this;
      var lazyRender = function() {
        if (self._renderQueue.length) {
          var
            key = self._renderQueue[ self._renderQueue.length-1 ],
            tiles = self._tileObjects[self._map.getZoom()];

          if (tiles[key]) {
            tiles[key].render();
          }

          self._renderQueue.pop();
        }
      };
      setInterval(function() {
        requestAnimationFrame(lazyRender);
      }, 33);

      L.TileLayer.prototype.initialize.call(this, '', options);
    },

    _getFeatureFromPos: function(pos) {
      var tile = { x: (pos.x/256) | 0, y: (pos.y/256) | 0 };
      var key = this._tileCoordsToKey(tile);
      var tileX = pos.x - 256*tile.x;
      var tileY = pos.y - 256*tile.y;
      var tiles = this._tileObjects[this._map.getZoom()];

      if (!tiles[key]) {
        return null;
      }

      return tiles[key].getFeatureAt(tileX, tileY);
    },

    _getTileFromPos: function(pos) {
      var tile = { x: (pos.x/256) | 0, y: (pos.y/256) | 0 };
      var key = this._tileCoordsToKey(tile);
      return this._tiles[key];
    },

    _addToRenderQueue: function(key, withPriority) {
      var index = this._renderQueue.indexOf(key);

      if (index > -1) {
        if (withPriority) {
          // remove earlier duplicate
          this._renderQueue.splice(index, 1);
        } else {
          // keep later duplicate and don't do anything
          return;
        }
      }

      this._renderQueue[withPriority ? 'push' : 'unshift'](key);
    },

    _renderAffectedTiles: function(idColumn) {
      var tiles = this._tileObjects[this._map.getZoom()];
      requestAnimationFrame(function() {
        for (var key in tiles) {
          if (!!tiles[key].getFeature(idColumn)) {
            tiles[key].render();
          }
        }
      });
    },

    _hoveredFeature: null,
    _clickedFeature: null,

    onAdd: function(map) {
      map.on('mousedown', function (e) {
        if (!this.options.interaction) {
          return;
        }

        // render previously highlighted tiles as normal
        if (this._clickedFeature) {
          this._renderAffectedTiles(this._clickedFeature[VECNIK.ID_COLUMN]);
        }

        this._clickedFeature = this._getFeatureFromPos(map.project(e.latlng));

        if (this._clickedFeature) {
          this._renderAffectedTiles(this._clickedFeature[VECNIK.ID_COLUMN]);

          this.fireEvent('featureClick', {
            feature: this._clickedFeature,
            geo: e.latlng,
            x: e.originalEvent.x,
            y: e.originalEvent.y
          });
        }
      }, this);

      map.on('mousemove', function (e) {
        if (!this.options.interaction) {
          return;
        }

        var pos = map.project(e.latlng);
        var tile = this._getTileFromPos(pos);
        var feature = this._getFeatureFromPos(pos);

        var payload = {
          geo: e.latlng,
          x: e.originalEvent.x,
          y: e.originalEvent.y
        };

        // mouse stays in same feature
        if (feature && this._hoveredFeature &&
          feature[VECNIK.ID_COLUMN] === this._hoveredFeature[VECNIK.ID_COLUMN]
        ) {
          payload.feature = this._hoveredFeature;
          this.fireEvent('featureOver', payload);
          return;
        }

        // mouse just left a feature
        if (this._hoveredFeature) {
          this._renderAffectedTiles(this._hoveredFeature[VECNIK.ID_COLUMN]);
          if (tile) {
            tile.style.cursor = 'inherit';
          }
          payload.feature = this._hoveredFeature;
          this.fireEvent('featureLeave', payload);
          this._hoveredFeature = null;
          return;
        }

        // mouse is outside any feature
        if (!feature) {
          delete payload.feature;
          this.fireEvent('featureOut', payload);
          return;
        }

        // mouse entered another feature
        this._hoveredFeature = feature;
        this._renderAffectedTiles(this._hoveredFeature[VECNIK.ID_COLUMN]);
        if (tile) {
          tile.style.cursor = 'pointer';
        }
        payload.feature = feature;
        this.fireEvent('featureEnter', payload);
      }, this);


      return L.TileLayer.prototype.onAdd.call(this, map);
    },

    _removeTile: function(key) {
      delete this._tileObjects[this._map.getZoom()][key];
      L.TileLayer.prototype._removeTile.call(this, key);
    },

    createTile: function(coords) {
      var tile = new Tile({
        coords: coords,
        layer: this,
        provider: this._provider,
        renderer: this._renderer
      });

      var
        key = this._tileCoordsToKey(coords),
        zoom = this._map.getZoom();

      (this._tileObjects[zoom] || (this._tileObjects[zoom] = []))[key] = tile;

      return tile.getDomElement();
    },

    redraw: function(forceReload) {
      this._renderQueue = [];

      if (!!forceReload) {
        this._centroidPositions = {};
        L.TileLayer.prototype.redraw.call(this);
        return this;
      }

      var timer = Profiler.metric('tiles.render.time').start();

      // get viewport tile bounds in order to render immediately, when visible
      var
        mapBounds = this._map.getPixelBounds(),
        tileSize = this._getTileSize(),
        tileBounds = L.bounds(
          mapBounds.min.divideBy(tileSize).floor(),
          mapBounds.max.divideBy(tileSize).floor()
        ),
        tiles = this._tileObjects[this._map.getZoom()];

      for (var key in tiles) {
        this._addToRenderQueue(key, tileBounds.contains(this._keyToTileCoords(key)));
      }

      timer.end();

      return this;
    },

    getCentroid: function(feature) {
      var
        scale = Math.pow(2, this._map.getZoom()),
        pos;

      if (pos = this._centroidPositions[feature.id]) {
        return { x: pos.x*scale <<0, y: pos.y*scale <<0 };
      }

      var featureParts = this._getFeatureParts(feature.id);
      if (pos = Geometry.getCentroid(featureParts)) {
        this._centroidPositions[feature.id] = { x: pos.x/scale, y: pos.y/scale };
        return pos;
      }
    },

    _getFeatureParts: function(id) {
      var
        tiles = this._tileObjects[this._map.getZoom()],
        tile,
        feature, f, fl,
        featureParts = [];

      for (var key in tiles) {
        tile = tiles[key];
        for (f = 0, fl = tile._data.length; f < fl; f++) {
          feature = tile._data[f];
          if (feature.id === id) {
            featureParts.push({ feature: feature, tileCoords: tile.getCoords() });
          }
        }
      }
      return featureParts;
    },

    setInteraction: function(flag) {
      this.options.interaction = !!flag;
      return this;
    },

    getHoveredFeature: function() {
      return this._hoveredFeature;
    },

    getClickedFeature: function() {
      return this._clickedFeature;
    }
  });
}
