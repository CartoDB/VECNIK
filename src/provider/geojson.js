
//========================================
// GeoJSON data provider
//========================================

var VECNIK = VECNIK || {};

(function(VECNIK) {

  VECNIK.GeoJsonProvider = function(options) {
    this.options = options;
    this._template = options.template;
  };

  var proto = VECNIK.GeoJsonProvider.prototype;

  proto._getUrl = function(x, y, zoom) {
    return this._template
      .replace('{z}', zoom.toFixed(0))
      .replace('{x}', x.toFixed(0))
      .replace('{y}', y.toFixed(0));
  };

  proto.load = function(coords, callback) {
    VECNIK.load(this._getUrl(coords.x, coords.y, coords.z))
      .on('load', callback); // TODO: implement async conversion and projection
    return this;
  };

})(VECNIK);
