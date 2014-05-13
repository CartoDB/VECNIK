// object access shortcuts
var
  Int32Array = Int32Array || Array,
  Uint8Array = Uint8Array || Array,
  m = Math,
  exp = m.exp,
  log = m.log,
  sin = m.sin,
  cos = m.cos,
  tan = m.tan,
  atan = m.atan,
  atan2 = m.atan2,
  min = m.min,
  max = m.max,
  sqrt = m.sqrt,
  ceil = m.ceil,
  floor = m.floor,
  round = m.round,
  pow = m.pow,
  win = window,
  doc = document;

if (!win.console) {
  win.console = {};
}

var
  VERSION     = /*<version=*/'0.1.9a'/*>*/,

  PI         = m.PI,
  HALF_PI    = PI/2,
  QUARTER_PI = PI/4,
  RAD        = 180/PI,

  POINT_RADIUS = 2,
  MAP_SIZE = 0, // total map size for current zoom, in pixels
  TILE_SIZE = 256,    // map tile size in pixels
  DATA_TILE_SIZE = 0.0075, // data tile size in geo coordinates, smaller: less data to load but more requests

  WIDTH = 0, HEIGHT = 0,
  ORIGIN_X = 0, ORIGIN_Y = 0,

  URL;
