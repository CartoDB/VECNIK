//========================================
// model
//
// pretty basic model funcionallity
//========================================

(function(VECNIK) {

    VECNIK.Model = function() {
      VECNIK.Events.prototype.constructor.call(this);
      this._data = {};
    };

    var proto = VECNIK.Model.prototype = new VECNIK.Events();

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

})(VECNIK);

if (typeof module !== 'undefined' && module.exports) {
  module.exports.Model = VECNIK.Model;
}
