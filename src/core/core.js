
var VECNIK = VECNIK || {};

(function(VECNIK) {

  // TODO: http get - should be improved
  VECNIK.load = function(url, callback) {
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
      if (req.readyState === 4) {
        if (req.status === 200) {
          callback(JSON.parse(req.responseText));
        }
      }
    };

    req.open('GET', url, true);
    req.send(null);
    return req;
  };

  VECNIK.Geometry = VECNIK.Geometry  || {};

  VECNIK.Geometry.POINT   = 'Point';
  VECNIK.Geometry.LINE    = 'LineString';
  VECNIK.Geometry.POLYGON = 'Polygon';

})(VECNIK);
