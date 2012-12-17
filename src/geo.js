
vecnik.geo = function() {

  var _x, _y, _type, _transform;

  // identity
  _transform = function(v) { return v; }

  function geo(data) {
  }

  function alloc(len) {
    _x = new Float32Array(len)
    _y = new Float32Array(len)
  }

  function _map(coordinates) {
    var c = coordinates;
    alloc(c.length);
    for(var i = 0; i < c.length; ++i) {
      var t = _transform(c[i]);
      _x[i] = t[0];
      _y[i] = t[1];
    }
  };

  geo.x = function() {
    return _x;
  }

  geo.y = function() {
    return _y;
  }

  var conversion = {
     Point: function(coordinates) {
        alloc(1);
        var t = _transform(coordinates);
        _x[0] = t[0];
        _y[0] = t[1];
     },
     LineString: _map,
     Polygon: function(coordinates) { _map(coordinates[0]); },
     MultiPoint: _map,
     MultiPolygon: function(polygons) {
       for(var i = 0; i < polygons.length; ++i) {
         geo.add(vecnik.geo().transform(_transform).parseGeoJSON({
          type: 'Polygon',
          coordinates: polygons[i]
         }));
       }
     }
  };

  geo.parseGeoJSON = function(geometry) {
    if(geometry.features) {
      for(var i in geometry.features) {
        var g = geometry.features[i];
        this.add(vecnik.geo().transform(_transform).parseGeoJSON(g));
      }
    } else {
      if(geometry.type === "Feature") {
        _metadata = geometry.properties;
        geometry = geometry.geometry;
      }
      _type = geometry.type;
      var conversor = conversion[_type];
      if(conversor) {
        conversor(geometry.coordinates);
      }
    }
    return geo;
  }

  geo.transform = function(tr) {
    _transform = tr;
    return geo;
  }

  geo.type = function(t) {
    if(!arguments.length) return _type;
    _type = t;
    return geo;
  }

  extend(geo, vecnik.Tree);

  return geo;

}
