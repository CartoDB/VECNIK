
Vecnik.Projection = function() {};

var proto = Vecnik.Projection.prototype;

proto.mapSize = 0; // total map size for current zoom, in pixels
proto.origin = { x:0, y:0 }; // total map size for current zoom, in pixels

proto.setMapSize = function(mapSize) {
  this.mapSize = mapSize;
};

proto.setOrigin = function(origin) {
  this.origin = origin;
};

proto.pixelToGeo = function(x, y) {
  var PI = Math.PI;
  x /= this.mapSize;
  y /= this.mapSize;
  return {
    latitude:   y <= 0  ? 90 : y >= 1 ? -90 : 180/PI * (2 * Math.atan(Math.exp(PI * (1 - 2*y))) - PI/2),
    longitude: (x === 1 ?  1 : (x%1 + 1) % 1) * 360 - 180
  };
};

proto.geoToPixel = function(lat, lon) {
  var
    PI = Math.PI,
    latitude  = Math.min(1, Math.max(0, 0.5 - (Math.log(Math.tan(3*PI/4 * lat / 180)) / PI) / 2)),
    longitude = lon/360 + 0.5;
  return {
    x: longitude*this.mapSize <<0,
    y: latitude *this.mapSize <<0
  };
};
