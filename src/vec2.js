

function _vec2(x, y) {
    this.x = x;
    this.y = y;
    this.length = function() {
        return Math.sqrt(this.x*this.x+this.y*this.y);
    }
    this.len2 = function() {
        return this.x*this.x+this.y*this.y;
    }
    this.add = function(v) {
        this.x += v.x;
        this.y += v.y;
    }
    this.clone = function() {
        return new vec2(this.x, this.y);
    }
}

var add = function(v1, v2) {
    return vec2(v1.x+v2.x, v1.y+v2.y);
}

var sub = function(v1, v2) {
    return vec2(v1.x-v2.x, v1.y-v2.y);
}

var mul = function(s, v1) {
    return vec2(s*v1.x, s*v1.y);
}

var dot = function(v1, v2) {
    return v1.x*v2.x + v1.y*v2.y;
}

var normalize = function(v1) {
    var m = v1.length();
    return vec2(v1.x/m, v1.y/m);
}

function vfn(v, fn) {
    return vec2(fn(v.x), fn(v.y));
}

function normal(v) {
    return vec2(-v.y, v.x);
}

vecnik.vec2 = function vec2(x, y) {
  return new _vec2(x, y);
}

vecnik.extend(vecnik.vec2, {
  add: add,
  sub: sub,
  dot: dot, 
  mul: mul,
  normalize: normalize,
  vfn: vfn,
  normal: normal
});
