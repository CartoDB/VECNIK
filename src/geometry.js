
//========================================
// geometry conversion
//========================================

var VECNIK = VECNIK || {};

(function(VECNIK) {

  var latlng = new VECNIK.LatLng(0, 0);
  var mercator = new VECNIK.MercatorProjection();

  var primitiveProjectors = {
      Point: function(coordinates, tileX, tileY, zoom) {
        latlng.latitude  = coordinates[1];
        latlng.longitude = coordinates[0];
        return mercator.latLngToTilePoint(latlng, tileX, tileY, zoom);
      },

      MultiPoint: function(coordinates, tileX, tileY, zoom) {
        var converted = [];
        var projector = primitiveProjectors.Point;
        for (var i = 0, il = coordinates.length; i < il; i++) {
          converted.push(projector(coordinates[i], tileX, tileY, zoom));
        }
        return converted;
      },

      LineString: function(coordinates, tileX, tileY, zoom) {
        return primitiveProjectors.MultiPoint(coordinates, tileX, tileY, zoom);
      },

      Polygon: function(coordinates, tileX, tileY, zoom) {
        var converted = [];
        var projector = primitiveProjectors.LineString;
        for (var i = 0, il = coordinates.length; i < il; i++) {
          converted.push(projector(coordinates[i], tileX, tileY, zoom));
        }
        return converted;
      },

      MultiPolygon: function(coordinates, tileX, tileY, zoom) {
        var converted = [];
        var projector = primitiveProjectors.Polygon;
        for (var i = 0, il = coordinates.length; i < il; i++) {
          converted.push(projector(coordinates[i], tileX, tileY, zoom));
        }
        return converted;
      }
    };

    VECNIK.projectGeometry = function(feature, tileX, tileY, zoom) {
      var projector = primitiveProjectors[feature.type];
      if (projector) {
        return projector(feature.coordinates, tileX, tileY, zoom);
      }
    };

})(VECNIK);

if (typeof module !== 'undefined' && module.exports) {
  module.exports.project_geometry = VECNIK.project_geometry;
}

if (typeof self !== 'undefined') {
  self.VECNIK = VECNIK;
}
