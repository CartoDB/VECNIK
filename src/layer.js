
var Geometry = require('./geometry');

// do this only when Leaflet exists (aka don't when run in web worker)
if (typeof L !== 'undefined') {
  var Tile = require('./tile');
  var Profiler = require('./profiler');

  var Layer = module.exports = L.TileLayer.extend({

    options: {
      maxZoom: 22
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

      this._tileObjects = {};
      this._centroidPositions = {};

      L.TileLayer.prototype.initialize.call(this, '', options);
    },

    onAdd: function(map) {
      var self = this;
      map.on('mousemove', function (e) {
        var pos = map.project(e.latlng);
        var tile = {
          x: (pos.x/256)|0,
          y: (pos.y/256)|0
        };
        var key = self._tileCoordsToKey(tile);
        var tile_x = pos.x - 256*tile.x;
        var tile_y = pos.y - 256*tile.y;
//        console.log(self._tileObjects[key].featureAt(tile_x, tile_y));
      });

      L.TileLayer.prototype.onAdd.call(this, map);
    },

    _removeTile: function(key) {
      delete this._tileObjects[key];
      L.TileLayer.prototype._removeTile.call(this, key);
    },

    createTile: function(coords) {
      var tile = new Tile({
        coords: coords,
        layer: this,
        provider: this._provider,
        renderer: this._renderer
      });

      var key = this._tileCoordsToKey(coords);
      this._tileObjects[key] = tile;

      return tile.getDomElement();
    },

    redraw: function(forceReload) {
      if (!!forceReload) {
        this._centroidPositions = {};
        L.TileLayer.prototype.redraw.call(this);
        return;
      }

      var timer = Profiler.metric('tiles.render.time').start();

      // get viewport tile bounds in order to render immediately, when visible
      var bounds = this._map.getPixelBounds(),
        tileSize = this._getTileSize(),
        tileBounds = L.bounds(
          bounds.min.divideBy(tileSize).floor(),
          bounds.max.divideBy(tileSize).floor());

// var start = Date.now();
      var renderQueue = [];
      for (var key in this._tileObjects) {
        if (tileBounds.contains(this._keyToTileCoords(key))) {
          this._tileObjects[key].render();
        } else {
          renderQueue.push(this._tileObjects[key]);
        }
      }
// console.log('RENDER PASS', Date.now()-start);
      for (var i = 0, il = renderQueue.length; i < il; i++) {
        renderQueue[i].render();
      }

      timer.end();
    },

    getCentroid: function(feature) {
      var
        scale = Math.pow(2, this._map.getZoom()),
        pos;

      if (pos = this._centroidPositions[feature.groupId]) {
        return { x: pos.x*scale <<0, y: pos.y*scale <<0 };
      }

      var featureParts = this.getFeatureParts(feature.groupId);
      if (pos = Geometry.getCentroid(featureParts)) {
        this._centroidPositions[feature.groupId] = { x: pos.x/scale, y: pos.y/scale };
        return pos;
      }
    },

    getFeatureParts: function(groupId) {
      var
        tileObject,
        feature, f, fl,
        featureParts = [];

      for (var key in this._tileObjects) {
        tileObject = this._tileObjects[key];
        for (f = 0, fl = tileObject._data.length; f < fl; f++) {
          feature = tileObject._data[f];
          if (feature.groupId === groupId) {
            featureParts.push({ feature:feature, tileCoords:tileObject.getCoords() });
          }
        }
      }
      return featureParts;
    }
  });
}
