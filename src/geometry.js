
//========================================
// geometry conversion
//========================================

// TODO: go for array buffers!

var VECNIK = VECNIK || {};

(function(VECNIK) {

  var LatLng = VECNIK.LatLng;

  //stats
  var stats = { vertices: 0 };

  var latlng = new LatLng(0, 0);
  var prj = new VECNIK.MercatorProjection();

  function map_latlon(ll, x, y, zoom) {
    latlng.latitude  = ll[1];
    latlng.longitude = ll[0];
    stats.vertices++;
    return prj.latLngToTilePoint(latlng, x, y, zoom);
  }

  var primitiveProjectors = {
      Point: function(x, y, zoom, coordinates) {
        return map_latlon(coordinates, x, y, zoom);
      },

      MultiPoint: function(x, y, zoom, coordinates) {
        var converted = [];
        var projector = primitiveProjectors.Point;
        for (var i = 0, il = coordinates.length; i < il; i++) {
          converted.push(projector(x, y, zoom, coordinates[i]));
        }
        return converted;
      },

      LineString: function(x, y, zoom, coordinates) {
        return primitiveProjectors.MultiPoint(x, y, zoom, coordinates);
      },

      Polygon: function(x, y, zoom, coordinates) {
        var converted = [];
        var projector = primitiveProjectors.LineString;
        for (var i = 0, il = coordinates.length; i < il; i++) {
          converted.push(projector(x, y, zoom, coordinates[i]));
        }
        return converted;
      },

      MultiPolygon: function(x, y, zoom, coordinates) {
        var converted = [];
        var projector = primitiveProjectors.Polygon;
        for (var i = 0, il = coordinates.length; i < il; i++) {
          converted.push(projector(x, y, zoom, coordinates[i]));
        }
        return converted;
      }
    };

    VECNIK.projectGeometry = function(feature, zoom, x, y) {
      var projector = primitiveProjectors[feature.type];
      if (projector) {
        return projector(x, y , zoom, feature.coordinates);
      }
    };

   VECNIK.geometry_stats = stats;

})(VECNIK);

if (typeof module !== 'undefined' && module.exports) {
  module.exports.project_geometry = VECNIK.project_geometry;
}
if (typeof self !== 'undefined') {
  self.VECNIK = VECNIK;
}
