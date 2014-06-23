importScripts('../../src/core/core.js');
importScripts('../../src/mercator.js');
importScripts('../../src/reader/geojson.js');

self.onmessage = function(e) {
  VECNIK.load(e.data.url, function(collection) {
    self.postMessage(VECNIK.GeoJSON.convertForWorker(collection, e.data.tileCoords));
    self.close();
  });
};
