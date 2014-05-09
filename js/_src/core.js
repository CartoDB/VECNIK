
vecnik = window.vecnik || {};

window.requestAnimFrame = (function(){
      return  window.requestAnimationFrame       ||
              window.webkitRequestAnimationFrame ||
              window.mozRequestAnimationFrame    ||
              window.oRequestAnimationFrame      ||
              window.msRequestAnimationFrame     ||
              function( callback ){
                window.setTimeout(callback, 1000 / 60);
              };
})();

var extend = function(obj, prop) {
  for(var p in prop) {
    obj[p] = prop[p];
  }
}

vecnik.extend = extend;

// simple tree implementation
// usage:
// extend(obj, vecnik.Tree)
vecnik.Tree = {

  add: function(node) {
    if(!node) return this;
    var cb = this.children();
    node._parent = this;
    cb.push(node);
    return this;
  },

  remove: function(node) {
    var cb = this.children();
    if(cb) {
      for(var c in cb) {
        if(node == cb[c]) {
          node._parent = null;
          this._children.splice(c, 1);
          return;
        }
      }
    }
    return this;
  },

  children: function() {
    return this._children || (this._children = []);
  },

  each: function(fn) {
    this.children().forEach(fn);
    return this;
  },

  any: function(fn) {
    for(var i in this.children()) {
      if(fn(this._children[i]))
        return true;
    }
    return false;
  }

}

vecnik.timer = (function() {

  function timer(fn) {
    if(fn._timer) return;
    fn._last = new Date().getTime();
    fn._timer = timer;
    timer.add(fn);
    requestAnimFrame(timer.tick);
  }

  timer.tick = function() {
    var remove = [];
    timer.each(function(n) {
      var now = new Date().getTime();
      var dt = now - n._last;
      if(!n.update(dt)) {
        remove.push(n);
      }
      n._last = now;
    });
    for(var r in remove) {
      var o = remove[r];
      timer.remove(o);
      o._timer = null;
    }
    if(timer._children.length) requestAnimFrame(timer.tick);
  }

  extend(timer, vecnik.Tree);

  return timer;

})();
