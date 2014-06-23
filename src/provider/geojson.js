
//========================================
// GeoJSON data provider
//========================================

var VECNIK = VECNIK || {};

(function(VECNIK) {

  VECNIK.GeoJSON = function(options) {
    this.options = options;
    this._template = options.template;
  };

  var proto = VECNIK.GeoJSON.prototype;

  proto._getUrl = function(x, y, zoom) {
    return this._template
      .replace('{z}', zoom.toFixed(0))
      .replace('{x}', x.toFixed(0))
      .replace('{y}', y.toFixed(0));
  };

  proto.load = function(coords) {
    VECNIK.load(this._getUrl(coords.x, coords.y, coords.z))
      .on('load', (function() {
        return function(data) {
          //this._reader.convertAsync(data, c).on('success', this.onLoad);
          // TODO: implement conversion and projection
          this.onLoad(data);
        };
      }(coords)), this);
    return this;
  };

  proto.onLoad = function() {
    throw new Error('VECNIK.GeoJSON.onLoad() has to be used');
  };

})(VECNIK);
