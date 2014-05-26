//========================================
// model
//
// pretty basic model funcionallity
//========================================

(function(VECNIK) {

    VECNIK.Model = function() {
      VECNIK.Events.prototype.constructor.call(this);
    };

    var proto = VECNIK.Model.prototype = new VECNIK.Events();

    proto.set = function(data, silent) {
      this.data = this.data || {};
      for (var v in data) {
        if (data.hasOwnProperty(v)) {
          this.data[v] = data[v];
        }
      }
      if (!silent) {
        this.emit('change', this.data);
      }
    };

    proto.get = function(attr, def) {
      this.data = this.data || {};
      if (attr in this.data) {
        return this.data[attr];
      }
      return def;
    };

    proto.unset = function(attr, silent) {
      this.data = this.data || {};
      delete this.data[attr];
      if (!silent) {
        this.emit('change', this.data);
      }
    };

    proto.destroy = function() {
      this.emit('destroy');
      delete this.data;
    };

})(VECNIK);

if (typeof module !== 'undefined' && module.exports) {
  module.exports.Model = VECNIK.Model;
}
