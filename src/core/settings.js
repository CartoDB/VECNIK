
//========================================
// Global settings
//========================================

var VECNIK = VECNIK || {};

(function(VECNIK) {

  VECNIK.Settings = function(defaults) {
    VECNIK.Model.prototype.constructor.call(this);
    this.set(defaults);
  }

  VECNIK.Settings.prototype = new VECNIK.Model();

  // default settings
  VECNIK.settings = new VECNIK.Settings({
    WEBWORKERS: true,
    BACKBUFFER: true
  });

})(VECNIK);

if (typeof module !== 'undefined' && module.exports) {
  module.exports.settings = VECNIK.settings;
}

if (typeof self !== 'undefined') {
  self.VECNIK = VECNIK;
}
