
vecnik.geo = function() {

  var _x, _y, _xt, _yt, _type, _transform;
  var _matrix = new mat2();

  // identity
  _transform = function(v) { return v; }

  function geo(data) {
  }

  function alloc(len) {
    _x = new Float32Array(len)
    _y = new Float32Array(len)
    _xt = new Float32Array(len)
    _yt = new Float32Array(len)
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

  geo.matrix = function(m) {
    if(!arguments.length) return _matrix;
    _matrix = m;
    this.each(function(g) {
      //todo multiply
      g.matrix(m);
    });
    return geo;
  }

  geo.x = function() {
    var _m = _matrix._m;
    for(var i = 0, len = _x.length; i < len; ++i) {
      _xt[i] = _m[0]*_x[i] + _m[6];
    }
    return _xt;
  }

  geo.y = function() {
    var _m = _matrix._m;
    for(var i = 0, len = _y.length; i < len; ++i) {
      _yt[i] = _m[1*3 + 1]*_y[i] + _m[7];
    }
    return _yt;
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

  geo.metadata = function() {
    return _metadata;
  }

  extend(geo, vecnik.Tree);

  return geo;

}
