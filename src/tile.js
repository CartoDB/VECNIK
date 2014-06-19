//========================================
// vecnik views
//========================================

// TODO: do we want a render loop, or rendering on demand, or loop+throttling

var VECNIK = VECNIK || {};

(function(VECNIK) {

  VECNIK.Tile = function(options) {
    options = options || {};

    // TODO: use internal renderer as default
    if (!options.renderer) {
      throw new Error('VECNIK.Tile requires a renderer');
    }

    this._renderer = options.renderer;
    this._x = options.coords.x;
    this._y = options.coords.y;
    this._zoom = options.coords.z;

    var
      canvas  = this._canvas  = document.createElement('CANVAS'),
      context = this._context = canvas.getContext('2d');

    canvas.width  = VECNIK.Tile.SIZE;
    canvas.height = VECNIK.Tile.SIZE;

    canvas.style.width  = canvas.width  +'px';
    canvas.style.height = canvas.height +'px';

    context.mozImageSmoothingEnabled = false;
    context.webkitImageSmoothingEnabled = false;

    this._data = [];
    this._load(options.url);
  };

  VECNIK.Tile.SIZE = 256;

  var proto = VECNIK.Tile.prototype;

  proto.getDomElement = function() {
    return this._canvas;
  };

  proto._load = function(url) {
    VECNIK.load(url).on('load', this._project, this);
  };

  proto._project = function(data) {
    var
      collection = data.features,
      feature, coordinates;

    if (VECNIK.settings.get('WEBWORKERS') && typeof Worker !== undefined) {
      var worker = new Worker('../src/projector.worker.js');

      var self = this;
      worker.onmessage = function(e) {
        self._data = e.data;
        self.render();
      };

      worker.postMessage({ collection: collection, x: this._x, y: this._y, zoom: this._zoom });
      return;
    }

    this._data = [];
    for (var i = 0, il = collection.length; i < il; i++) {
      feature = collection[i];
      if (!feature.geometry) {
        continue;
      }

      coordinates = VECNIK.projectGeometry(feature.geometry, this._x, this._y, this._zoom);
      if (!coordinates || !coordinates.length) {
        continue;
      }

      this._data.push({
        coordinates: coordinates,
        type: feature.geometry.type,
        properties: feature.properties
      });
    }
    this.render();
  };

  proto.render = function() {
    this._renderer.render(this._context, this._data, {
      zoom: this._zoom
    });
  };

})(VECNIK);
