//========================================
// vecnik views
//========================================

// TODO: do we want a render loop, or rendering on demand, or loop+throttling

(function(VECNIK) {

  VECNIK.Tile = function(options) {
    options = options || {};

    // TODO: use internal renderer as default
    if (!options.renderer) {
      throw new Error('VECNIK.Tile requires a renderer');
    }

    this._renderer = options.renderer;

    var
      canvas = this._canvas = document.createElement('CANVAS'),
      context = this._context = canvas.getContext('2d');

    context.mozImageSmoothingEnabled = false;
    context.webkitImageSmoothingEnabled = false;

    this._load(options.url);
  };

  var proto = VECNIK.Tile.prototype;

  proto.getDomElement = function() {
    return this._canvas;
  };

  proto._load = function(url) {
    VECNIK.load(url).on('load', this._project, this);
  };

  proto._project = function(data) {
    var collection = data.features;
console.log(data)
//    if (VECNIK.settings.get('WEBWORKERS') && typeof Worker !== undefined) {
//      var worker = new Worker('../src/projector.worker.js');
//      var self = this;
//      worker.onmessage = function(e) {
//        self.emit('ready', e.data);
//      };
//      worker.postMessage({ collection:collection, zoom:this._mapZoom });
//    } else {

      var
        res = [],
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

        res.push({
          coordinates: coordinates,
          type: feature.geometry.type,
          properties: feature.properties
        });
      }
//    }

    this._data = res;
    this.render();
  };

  proto.render = function(origin) {
    this._renderer.render(this._context, this._data, origin);
  };

})(VECNIK);
