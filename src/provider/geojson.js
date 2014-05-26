
//========================================
// GeoJSON data provider
//========================================

(function(VECNIK) {

  VECNIK.GeoJSON = function(opts) {
    this.opts = opts;
    this.template = opts.template;
  };

  var proto = VECNIK.GeoJSON.prototype;

  proto.getUrl = function(x, y, z) {
    return this.template
      .replace('{z}', z.toFixed(0))
      .replace('{x}', x.toFixed(0))
      .replace('{y}', y.toFixed(0));
  };

})(VECNIK);
