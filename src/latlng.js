
vecnik.LatLng = function(lat, lng) {
  this.x = lng;
  this.y = lat;
}

vecnik.LatLng.prototype = vecnik.vec2(0, 0);

vecnik.extend(vecnik.LatLng.prototype,  {

  lat: function() {
    return this.y;
  }, 

  lon: function() {
    return this.x;
  }

});

