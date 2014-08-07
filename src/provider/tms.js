
var Projection = require('../mercator');

var TMS = module.exports = function(template, reader) {
  this._template = template;

  if (!reader) {
    throw new Error('TMS Provider requires a reader');
  }

  this._reader = reader;
  this._projection = new Projection();
  this.update(options);
};

var proto = TMS.prototype;

proto._getUrl = function(coords) {
  return this._template
    .replace('{z}', coords.z.toFixed(0))
    .replace('{x}', coords.x.toFixed(0))
    .replace('{y}', coords.y.toFixed(0));
};

proto.load = function(tile, callback) {
  this._reader.load(this._getUrl(tile), tile, callback);
};

proto.update = function() {};
