importScripts('../src/mercator.js');
importScripts('../src/geometry.js');

self.onmessage = function(e) {
  var
    data = [],
    tile = e.data.tile,
    collection = e.data.collection,
    zoom = e.data.zoom;

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

    data.push({
      coordinates: coordinates,
      type: feature.geometry.type,
      properties: feature.properties
    });
  }

  tile.data = data;
  self.postMessage(tile);
  self.close();
};
