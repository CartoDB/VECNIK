
Vecnik.Event = function() {
  this.listeners = {};
};

var proto = Vecnik.Event.prototype;

proto.on = function(type, listener, scope) {
  var listeners = this.listeners[type] || (this.listeners[type] = []);
  listeners.push(function(type, data) {
    var e = { type:type };
    if (data) {
      e.data = data;
    }
    listener.call(scope || null, e);
  });
};

proto.emit = function(type, data) {
  if (!this.listeners[type]) {
    return;
  }
  var listeners = this.listeners[type];
  for (var i = 0, il = listeners.length; i < il; i++) {
    listeners[i](type, data);
  }
};
