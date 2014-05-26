
(function(VECNIK) {

  // utility
  function Profiler() {
    this.t0 = 0;
    this.unit = '';
  }

  Profiler.prototype.start = function(unit) {
    this.t0 = new Date().getTime();
    this.unit =  unit || '';
  };

  Profiler.prototype.end = function() {
     var t = new Date().getTime() - this.t0;
     //console.log("PROFILE - " + this.unit + ":" + t);
     return t;
  };

  VECNIK.Profiler = Profiler;

})(VECNIK);
