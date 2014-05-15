var
  VERSION     = /*<version=*/'0.1.9a'/*>*/,
  ATTRIBUTION = '&copy; Vecnik',

  PI         = m.PI,
  HALF_PI    = PI/2,
  QUARTER_PI = PI/4,
  RAD        = 180/PI,

  POINT_RADIUS = 2,
  MAP_SIZE = 0, // total map size for current zoom, in pixels
  TILE_SIZE = 256,    // map tile size in pixels
  DATA_TILE_SIZE = 0.0075, // data tile size in geo coordinates, smaller: less data to load but more requests

  WIDTH = 0, HEIGHT = 0,
  CENTER_X = 0, CENTER_Y = 0,
  ORIGIN_X = 0, ORIGIN_Y = 0,

  URL;
