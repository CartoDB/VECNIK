
//========================================
// Event handling
//========================================

(function(VECNIK) {

  VECNIK.Events = function() {
    this.listeners = {};
  };

  var proto = VECNIK.Events.prototype;

  proto.on = function(type, listener, scope) {
    var listeners = this.listeners[type] || (this.listeners[type] = []);
    listeners.push(function(payload) {
      listener.call(scope, payload);
    });
    return this;
  };

  proto.emit = function(type, payload) {
    if (!this.listeners[type]) {
      return;
    }
    var listeners = this.listeners[type];
    for (var i = 0, il = listeners.length; i < il; i++) {
      listeners[i](payload);
    }
  };
}(VECNIK));

if (typeof module !== 'undefined' && module.exports) {
  module.exports.Events = VECNIK.Events;
}
