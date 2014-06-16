
//========================================
// geometry conversion
//========================================

var VECNIK = VECNIK || {};

(function(VECNIK) {

  var latlng = new VECNIK.LatLng(0, 0);
  var mercator = new VECNIK.MercatorProjection();

  var primitiveProjectors = {
      Point: function(coordinates, zoom) {
        latlng.latitude  = coordinates[1];
        latlng.longitude = coordinates[0];
        return mercator.latLngToWorldPoint(latlng, zoom);
      },

      MultiPoint: function(coordinates, zoom) {
        var converted = [];
        var projector = primitiveProjectors.Point;
        for (var i = 0, il = coordinates.length; i < il; i++) {
          converted.push(projector(coordinates[i], zoom));
        }
        return converted;
      },

      LineString: function(coordinates, zoom) {
        return primitiveProjectors.MultiPoint(coordinates, zoom);
      },

      Polygon: function(coordinates, zoom) {
        var converted = [];
        var projector = primitiveProjectors.LineString;
        for (var i = 0, il = coordinates.length; i < il; i++) {
          converted.push(projector(coordinates[i], zoom));
        }
        return converted;
      },

      MultiPolygon: function(coordinates, zoom) {
        var converted = [];
        var projector = primitiveProjectors.Polygon;
        for (var i = 0, il = coordinates.length; i < il; i++) {
          converted.push(projector(coordinates[i], zoom));
        }
        return converted;
      }
    };

    VECNIK.projectGeometry = function(feature, zoom) {
      var projector = primitiveProjectors[feature.type];
      if (projector) {
        return projector(feature.coordinates, zoom);
      }
    };

})(VECNIK);

if (typeof module !== 'undefined' && module.exports) {
  module.exports.project_geometry = VECNIK.project_geometry;
}
if (typeof self !== 'undefined') {
  self.VECNIK = VECNIK;
}
