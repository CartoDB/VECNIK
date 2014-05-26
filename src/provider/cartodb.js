
//========================================
// CartoDB data provider
//========================================

(function(VECNIK) {

  VECNIK.CartoDB = VECNIK.CartoDB || {};

  VECNIK.CartoDB.API = function(opts) {
    this.projection = new VECNIK.MercatorProjection();
    this.opts = opts;
    this.base_url = 'http://'+ opts.user +'.cartodb.com/api/v2/sql';

    if (this.opts.ENABLE_SIMPLIFY === undefined) {
      this.opts.ENABLE_SIMPLIFY = true;
    }
    if (this.opts.ENABLE_SNAPPING === undefined) {
      this.opts.ENABLE_SNAPPING = false;
    }
    if (this.opts.ENABLE_CLIPPING === undefined) {
      this.opts.ENABLE_CLIPPING = false;
    }
    if (this.opts.ENABLE_FIXING === undefined) {
      this.opts.ENABLE_FIXING = false;
    }
  };

  var proto = VECNIK.CartoDB.API.prototype;

  proto._debug = function(msg) {
    if (this.opts.debug) {
      console.log(msg);
    }
  };

  proto._getSqlUrl = function(sql) {
    this._debug(sql);
    return this.base_url +'?q='+ encodeURIComponent(sql) +'&format=geojson&dp=6';
  };

  proto.getUrl = function(x, y, zoom) {
    var sql = VECNIK.CartoDB.SQL(this.projection, this.opts.table, x, y, zoom, this.opts);
    return this._getSqlUrl(sql);
  };

})(VECNIK);
