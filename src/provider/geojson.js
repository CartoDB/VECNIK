
//========================================
// GeoJSON data provider
//========================================

var VECNIK = VECNIK || {};

(function(VECNIK) {

  VECNIK.GeoJSON = function(opts) {
    this.opts = opts;
    this.template = opts.template;
  };

  var proto = VECNIK.GeoJSON.prototype;

  proto.getUrl = function(x, y, zoom) {
    return this.template
      .replace('{z}', zoom.toFixed(0))
      .replace('{x}', x.toFixed(0))
      .replace('{y}', y.toFixed(0));
  };

})(VECNIK);
