
//========================================
// Event handling
//========================================

(function(VECNIK) {

  VECNIK.Events = function() {
    this._listeners = {};
  };

  var proto = VECNIK.Events.prototype;

  proto.on = function(type, listener, scope) {
    var listeners = this._listeners[type] || (this._listeners[type] = []);
    listeners.push(function(payload) {
      listener.call(scope, payload);
    });
    return this;
  };

  proto.emit = function(type, payload) {
    if (!this._listeners[type]) {
      return;
    }
    var listeners = this._listeners[type];
    for (var i = 0, il = listeners.length; i < il; i++) {
      listeners[i](payload);
    }
  };
}(VECNIK));

if (typeof module !== 'undefined' && module.exports) {
  module.exports.Events = VECNIK.Events;
}
