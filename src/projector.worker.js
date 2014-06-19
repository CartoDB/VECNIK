importScripts('../src/mercator.js');

self.onmessage = function(e) {
  var
    options = e.data,
    collection = options.collection,
    x = options.x,
    y = options.y,
    zoom = options.zoom,
    data = [],
    feature, coordinates;

  for (var i = 0, il = collection.length; i < il; i++) {
    feature = collection[i];
    if (!feature.geometry) {
      continue;
    }

    coordinates = VECNIK.projectGeometry(feature.geometry, x, y, zoom);
    if (!coordinates || !coordinates.length) {
      continue;
    }

    data.push({
      coordinates: coordinates,
      type: feature.geometry.type,
      properties: feature.properties
    });
  }

  self.postMessage(data);
  self.close();
};
