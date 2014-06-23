
//========================================
// CartoDB data provider
//========================================

var VECNIK = VECNIK || {};

(function(VECNIK) {

  VECNIK.CartoDB = VECNIK.CartoDB || {};

  VECNIK.CartoDB.API = function(options) {
    this._options = options;
    // TODO: maybe define the reader in options
    this._projection = new VECNIK.MercatorProjection();
    this._reader = new VECNIK.GeoJson({ projection: this._projection });
    this._baseUrl = 'http://'+ options.user +'.cartodb.com/api/v2/sql';

    if (this._options.ENABLE_SIMPLIFY === undefined) {
      this._options.ENABLE_SIMPLIFY = true;
    }
    if (this._options.ENABLE_SNAPPING === undefined) {
      this._options.ENABLE_SNAPPING = true;
    }
    if (this._options.ENABLE_CLIPPING === undefined) {
      this._options.ENABLE_CLIPPING = true;
    }
    if (this._options.ENABLE_FIXING === undefined) {
      this._options.ENABLE_FIXING = true;
    }
  };

  var proto = VECNIK.CartoDB.API.prototype;

  proto._debug = function(msg) {
    if (this._options.debug) {
      console.log(msg);
    }
  };

  proto._getUrl = function(x, y, zoom) {
    var sql = VECNIK.CartoDB.SQL(this._projection, this._options.table, x, y, zoom, this._options);
    this._debug(sql);
    return this._baseUrl +'?q='+ encodeURIComponent(sql) +'&format=geojson&dp=6';
  };

  proto.load = function(coords, callback) {
console.log('LOAD...', coords.x, coords.y);
    VECNIK.load(this._getUrl(coords.x, coords.y, coords.z))
      .on('load', (function(coords_) {

console.log('ON LOAD', coords_.x, coords_.y);
        return function(data) {

console.log('ON CONVERT', coords_.x, coords_.y);
          this._reader.convertAsync(data, coords_, callback);
        };

      }(coords)), this);

    return this;
  };

})(VECNIK);
