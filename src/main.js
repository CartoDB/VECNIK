
(function(global) {
  global.requestAnimationFrame = global.requestAnimationFrame ||
    global.mozRequestAnimationFrame ||
    global.webkitRequestAnimationFrame ||
    global.msRequestAnimationFrame ||
    function(callback) {
      return global.setTimeout(callback, 16);
    };

  global.Int32Array = global.Int32Array || global.Array,
  global.Uint8Array = global.Uint8Array || global.Array;

  if (!global.console) {
    global.console = {};
  }

}(self || window || global));

var VECNIK = require('./core/core');
VECNIK.CartoDB     = { API: require('./provider/cartodb') };
VECNIK.CartoShader = require('./shader');
VECNIK.CartoShaderLayer = require('./shader.layer');
VECNIK.Renderer    = require('./renderer');
VECNIK.Layer       = require('./layer');
// TODO: worker should use whatever reader the user defined
VECNIK.GeoJSON     = require('./reader/geojson'); // exposed for web worker
VECNIK.Geometry    = require('./geometry');
VECNIK.Profiler    = require('./profiler');

module.exports = VECNIK;
