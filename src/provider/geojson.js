
//========================================
// CartoDB data provider
//========================================

(function(VECNIK) {

  VECNIK.GeoJSONTile = function(opts) {
    this.opts = opts;
    this.template = opts.template;
  };

  var proto = VECNIK.GeoJSONTile.prototype;

  proto.url = function(coord) {
    return this.template
      .replace('{z}', coord.zoom.toFixed(0))
      .replace('{x}', coord.column.toFixed(0))
      .replace('{y}', coord.row.toFixed(0));
  };

})(VECNIK);
