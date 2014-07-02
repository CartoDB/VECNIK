
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
VECNIK.CartoDB = { API: require('./provider/cartodb') };
VECNIK.CartoShader = require('./shader');
VECNIK.Renderer = require('./renderer');
VECNIK.Layer = require('./layer');
VECNIK.GeoJSON = require('./reader/geojson'); // exposed for web worker
VECNIK.Profiler = require('./profiler');
VECNIK.CartoShader = require('./shader.layer');
VECNIK.Geometry = require('./geometry');
// TODO: worker should use whatever reader the user defined

module.exports = VECNIK;
