
var VECNIK = VECNIK || {};

(function(VECNIK) {

  VECNIK.Profiler = function() {
    this.t0 = 0;
    this.unit = '';
  };

  var proto = VECNIK.Profiler.prototype;

  proto.start = function(unit) {
    this.t0 = new Date().getTime();
    this.unit =  unit || '';
  };

  proto.end = function() {
     var t = new Date().getTime() - this.t0;
     //console.log("PROFILE - " + this.unit + ":" + t);
     return t;
  };

})(VECNIK);
