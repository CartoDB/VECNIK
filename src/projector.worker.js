importScripts('../js/mercator.js');
importScripts('../js/geometry.js');

this.onmessage = function(event) {
  var data = event.data;
  var collection = data.collection;
  var geometry = [];
  for (var i = 0; i < collection.length; ++i) {
    var p = collection[i];
    if (p.geometry) {
      var coordinates = VECNIK.projectGeometry(p.geometry, data.zoom);
      if (coordinates && coordinates.length !== 0) {
         geometry.push({
           coordinates: coordinates,
           type: p.geometry.type,
           properties: p.properties
         });
      }
    }
  }
  this.postMessage({ geometry: geometry });
};
