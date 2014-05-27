
//========================================
// CartoDB data provider
//========================================

(function(VECNIK) {

  VECNIK.CartoDB = VECNIK.CartoDB || {};

  VECNIK.CartoDB.API = function(options) {
    this.projection = new VECNIK.MercatorProjection();
    this.options = options;
    this.base_url = 'http://'+ options.user +'.cartodb.com/api/v2/sql';

    if (this.options.ENABLE_SIMPLIFY === undefined) {
      this.options.ENABLE_SIMPLIFY = true;
    }
    if (this.options.ENABLE_SNAPPING === undefined) {
      this.options.ENABLE_SNAPPING = true;
    }
    if (this.options.ENABLE_CLIPPING === undefined) {
      this.options.ENABLE_CLIPPING = true;
    }
    if (this.options.ENABLE_FIXING === undefined) {
      this.options.ENABLE_FIXING = true;
    }
  };

  var proto = VECNIK.CartoDB.API.prototype;

  proto._debug = function(msg) {
    if (this.options.debug) {
      console.log(msg);
    }
  };

  proto._getSqlUrl = function(sql) {
    this._debug(sql);
    return this.base_url +'?q='+ encodeURIComponent(sql) +'&format=geojson&dp=6';
  };

  proto.getUrl = function(x, y, zoom) {
    var sql = VECNIK.CartoDB.SQL(this.projection, this.options.table, x, y, zoom, this.options);
    return this._getSqlUrl(sql);
  };

})(VECNIK);
