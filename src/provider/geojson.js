
var Core = require('./code/core.js');

var Provider = module.exports = function(options) {
  this.options = options;
  this._template = options.template;
};

var proto = Provider.prototype;

proto._getUrl = function(x, y, zoom) {
  return this._template
    .replace('{z}', zoom.toFixed(0))
    .replace('{x}', x.toFixed(0))
    .replace('{y}', y.toFixed(0));
};

// TODO: refactor this
proto.load = function(coords, callback) {
  Core.load(this._getUrl(coords.x, coords.y, coords.z), callback); // TODO: implement async conversion and projection
};
