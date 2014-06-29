
var Events = require('./core/events');

var Model = module.exports = function() {
    Events.prototype.constructor.call(this);
    this._data = {};
  };

var proto = Model.prototype = new Events();

proto.set = function(data, silent) {
  var keys = [];
  for (var key in data) {
    if (data.hasOwnProperty(key)) {
      this._data[key] = data[key];
      keys.push(key);
    }
  }
  if (!silent) {
    this.emit('change', keys);
  }
};

proto.get = function(key, def) {
  if (key in this._data) {
    return this._data[key];
  }
  return def;
};

proto.unset = function(key, silent) {
  this._data = this._data || {};
  delete this._data[key];
  if (!silent) {
    this.emit('change', [key]);
  }
};

proto.destroy = function() {
  this.emit('destroy');
  delete this._data;
};
