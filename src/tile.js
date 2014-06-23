//========================================
// vecnik views
//========================================

// TODO: do we want a render loop, or rendering on demand, or loop+throttling

var VECNIK = VECNIK || {};

(function(VECNIK) {

  VECNIK.Tile = function(options) {
    options = options || {};

    var
      canvas  = this._canvas  = document.createElement('CANVAS'),
      context = this._context = canvas.getContext('2d');

    canvas.width  = VECNIK.Tile.SIZE;
    canvas.height = VECNIK.Tile.SIZE;

    canvas.style.width  = canvas.width  +'px';
    canvas.style.height = canvas.height +'px';

    context.mozImageSmoothingEnabled = false;
    context.webkitImageSmoothingEnabled = false;

    this._renderer = options.renderer;
    this._data = [];

    var self = this;
    options.provider.load(options.coords, function(data) {
      self._data = data;
      self.render();
    });
  };

  VECNIK.Tile.SIZE = 256;

  var proto = VECNIK.Tile.prototype;

  proto.getDomElement = function() {
    return this._canvas;
  };

  proto.render = function() {
    this._renderer.render(this._context, this._data, {
      zoom: this._zoom
    });
  };

})(VECNIK);
