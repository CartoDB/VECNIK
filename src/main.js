
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

VECNIK.Geometry    = require('./geometry');
VECNIK.Canvas      = require('./canvas');
VECNIK.Shader      = require('./shader');
VECNIK.CartoShader = require('./cartoshader');
VECNIK.Renderer    = require('./renderer');

// Providers
VECNIK.CartoDB     = require('./provider/cartodb');
VECNIK.TMS         = require('./provider/tms');

// Readers
VECNIK.GeoJSON     = require('./reader/geojson');
VECNIK.VectorTile  = require('./reader/vectortile');

VECNIK.Layer       = require('./layer');
VECNIK.Tile        = require('./tile');
VECNIK.Profiler    = require('./profiler');

module.exports = VECNIK;
