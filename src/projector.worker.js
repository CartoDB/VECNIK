importScripts(VECNIK.baseDir + '/mercator.js');
importScripts(VECNIK.baseDir + '/geometry.js');

this.onmessage = function(e) {
  var
    collection = e.data.collection,
    zoom = e.data.zoom,
    res = [];

  var feature, coordinates;
  for (var i = 0, il = collection.length; i < il; i++) {
    feature = collection[i];
    if (!feature.geometry) {
      continue;
    }

    coordinates = VECNIK.projectGeometry(feature.geometry, zoom);
    if (!coordinates || !coordinates.length) {
      continue;
    }

    res.push({
      coordinates: coordinates,
      type: feature.geometry.type,
      properties: feature.properties
    });
  }

  this.postMessage(res);
};
