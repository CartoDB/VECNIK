
//========================================
// Mercator projection
//========================================

vecnik.mercator = function() {

  var TILE_SIZE = 256;
  var pixelOrigin_ = [TILE_SIZE / 2, TILE_SIZE / 2 ];
  var pixelsPerLonDegree_ = TILE_SIZE / 360;
  var pixelsPerLonRadian_ = TILE_SIZE / (2 * Math.PI);

  function _mercator(latLng, opt_point) {
    var me = this;
    var point = opt_point || [0, 0];
    var origin = pixelOrigin_;

    point[0] = origin[0] + latLng[0] * pixelsPerLonDegree_;

    // NOTE(appleton): Truncating to 0.9999 effectively limits latitude to
    // 89.189.  This is about a third of a tile past the edge of the world
    // tile.
    var siny = bound(Math.sin(degreesToRadians(latLng[1])), -0.9999,
        0.9999);
    point[1] = origin[1] + 0.5 * Math.log((1 + siny) / (1 - siny)) *
        -pixelsPerLonRadian_;
    return point;
  }

  return _mercator;

}
