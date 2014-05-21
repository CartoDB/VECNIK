
//========================================
// CartoDB data provider
//========================================

(function(VECNIK) {

  function CartoDBSQLAPI(opts) {
    this.projection = new VECNIK.MercatorProjection();
    this.opts = opts;
    this.base_url = 'http://'+ opts.user +'.cartodb.com/api/v2/sql';

    if (this.opts.ENABLE_SIMPLIFY === undefined) {
      this.opts.ENABLE_SIMPLIFY = true;
    }
    if (this.opts.ENABLE_SNAPPING === undefined) {
      this.opts.ENABLE_SNAPPING = true;
    }
    if (this.opts.ENABLE_CLIPPING === undefined) {
      this.opts.ENABLE_CLIPPING = true;
    }
    if (this.opts.ENABLE_FIXING === undefined) {
      this.opts.ENABLE_FIXING = true;
    }
  }

  var proto = CartoDBSQLAPI.prototype;

  proto.debug = function(w) {
    if (this.opts.debug && console) {
      console.log(w);
    }
  };

  proto._getSqlUrl = function(sql) {
    this.debug(sql);
    return this.base_url +'?q='+ encodeURIComponent(sql) +'&format=geojson&dp=6';
  };

  proto.url = function(coordinates) {
    return this.getUrl(coordinates.column, coordinates.row, coordinates.zoom);
  };

  proto.getUrl = function(x, y, z) {
    var sql = VECNIK.CartoDB.SQL(this.projection, this.opts.table, x, y, z, this.opts);
    return this._getSqlUrl(sql);
  };

  VECNIK.CartoDB = VECNIK.CartoDB || {};
  VECNIK.CartoDB.API = CartoDBSQLAPI;

})(VECNIK);
