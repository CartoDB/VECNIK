
var CartoDB = module.exports = {};

CartoDB.SQL = require('./cartodb.sql').SQL;

CartoDB.API = function(reader, options) {
  if (!reader) {
    throw new Error('Provider requires a Reader');
  }
  this._reader = reader;
  this.update(options);
};

var proto = CartoDB.API.prototype;

proto._debug = function(msg) {
  if (this._options.debug) {
    console.log(msg);
  }
};

proto._getUrl = function(coords) {
  var sql = CartoDB.SQL(this._options.table, coords.x, coords.y, coords.z, this._options);
  this._debug(sql);
  return this._baseUrl +'?q='+ encodeURIComponent(sql) +'&format=geojson&dp=6';
};

proto.load = function(tile, callback) {
  this._reader.load(this._getUrl(tile), tile, callback);
};

proto.update = function(options) {
  this._options = options;
  this._baseUrl = 'http://'+ options.user +'.cartodb.com/api/v2/sql';

// this is how cdn would be handled
//  this._baseUrl = 'http://3.ashbu.cartocdn.com/' + options.user +'/api/v1/sql';

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
