
//========================================
// CartoDB data provider 
//========================================

(function(VECNIK) {

  function GeoJSONTile(opts) {
      this.opts = opts;
      this.template = opts.template;
  }

  GeoJSONTile.prototype.url = function(coord) {
     return this.template
                  .replace('{z}', coord.zoom.toFixed(0))
                  .replace('{x}', coord.column.toFixed(0))
                  .replace('{y}', coord.row.toFixed(0));
  }

  VECNIK.GeoJSONTile = GeoJSONTile;

})(VECNIK);
