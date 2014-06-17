
//========================================
// Mercator projection
//========================================
//

var VECNIK = VECNIK || {};

(function(VECNIK) {

  // TODO: somehow VECNIK.Tile.SIZE gets lost on tile creation
  var tileSize = VECNIK.Tile ? VECNIK.Tile.SIZE : 256;

  // todo: move outside
  function Point(x, y) {
    this.x = x || 0;
    this.y = y || 0;
  }

  function LatLng(lat, lon) {
    this.latitude = lat || 0;
    this.longitude = lon || 0;
  }

  LatLng.prototype.lat = function() {
    return this.latitude;
  };

  LatLng.prototype.lng = function() {
    return this.longitude;
  };

  function bound(value, optMin, optMax) {
    if (optMin !== null) value = Math.max(value, optMin);
    if (optMax !== null) value = Math.min(value, optMax);
    return value;
  }

  function degreesToRadians(deg) {
    return deg * (Math.PI / 180);
  }

  function radiansToDegrees(rad) {
    return rad / (Math.PI / 180);
  }

  function MercatorProjection() {
    this.pixelOrigin_ = new Point(tileSize / 2, tileSize / 2);
    this.pixelsPerLonDegree_ = tileSize / 360;
    this.pixelsPerLonRadian_ = tileSize / (2 * Math.PI);
  }

  MercatorProjection.prototype.fromLatLngToPoint = function(latLng, opt_point) {
    var me = this;
    var point = opt_point || new Point(0, 0);
    var origin = me.pixelOrigin_;

    point.x = origin.x + latLng.lng() * me.pixelsPerLonDegree_;

    // NOTE(appleton): Truncating to 0.9999 effectively limits latitude to
    // 89.189.  This is about a third of a tile past the edge of the world
    // tile.
    var siny = bound(Math.sin(degreesToRadians(latLng.lat())), -0.9999, 0.9999);
    point.y = origin.y + 0.5 * Math.log((1 + siny) / (1 - siny)) * -me.pixelsPerLonRadian_;
    return point;
  };

  MercatorProjection.prototype.fromPointToLatLng = function(point) {
    var me = this;
    var origin = me.pixelOrigin_;
    var lng = (point.x - origin.x) / me.pixelsPerLonDegree_;
    var latRadians = (point.y - origin.y) / -me.pixelsPerLonRadian_;
    var lat = radiansToDegrees(2 * Math.atan(Math.exp(latRadians)) - Math.PI / 2);
    return new LatLng(lat, lng);
  };

  MercatorProjection.prototype.tileBBox = function(x, y, zoom) {
    var numTiles = 1 <<zoom;
    var inc = tileSize/numTiles;
    var px = x*tileSize/numTiles;
    var py = y*tileSize/numTiles;
    return [
      this.fromPointToLatLng(new Point(px, py + inc)),
      this.fromPointToLatLng(new Point(px + inc, py))
    ];
  };

  MercatorProjection.prototype.tilePixelPos = function(tileX, tileY) {
    return {
      x: tileX*tileSize,
      y: tileY*tileSize
    };
  };

  MercatorProjection.prototype.latLngToTilePoint = function(latLng, tileX, tileY, zoom) {
    var numTiles = 1 <<zoom;
    var worldCoordinate = this.fromLatLngToPoint(latLng);
    var pixelCoordinate = new Point(worldCoordinate.x*numTiles, worldCoordinate.y*numTiles);
    var tilePixelPos    = this.tilePixelPos(tileX, tileY);
    return new Point(Math.round(pixelCoordinate.x-tilePixelPos.x), Math.round(pixelCoordinate.y-tilePixelPos.y));
  };

  MercatorProjection.prototype.latLngToWorldPoint = function(latLng, zoom) {
    var numTiles = 1 <<zoom;
    var worldCoordinate = this.fromLatLngToPoint(latLng);
    return new Point(worldCoordinate.x*numTiles, worldCoordinate.y*numTiles);
  };

  MercatorProjection.prototype.latLngToTile = function(latLng, zoom) {
    var numTiles = 1 <<zoom;
    var projection = this;
    var worldCoordinate = projection.fromLatLngToPoint(latLng);
    var pixelCoordinate = new Point(worldCoordinate.x * numTiles, worldCoordinate.y * numTiles);
    return new Point(Math.floor(pixelCoordinate.x / tileSize), Math.floor(pixelCoordinate.y / tileSize));
  };

  VECNIK.LatLng = LatLng;
  VECNIK.Point = Point;
  VECNIK.MercatorProjection = MercatorProjection;

})(VECNIK);

if (typeof module !== 'undefined' && module.exports) {
  module.exports.MercatorProjection = VECNIK.MercatorProjection;
  module.exports.LatLng = VECNIK.LatLng;
  module.exports.Point = VECNIK.Point;
}

if (typeof self !== 'undefined') {
  self.VECNIK = VECNIK;
}
