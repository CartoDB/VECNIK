importScripts('../../vecnik.debug.js');

self.onmessage = function(e) {
  VECNIK.load(e.data.url, function(collection) {
    self.postMessage(VECNIK.GeoJSON.convertForWorker(collection, e.data.tileCoords));
    self.close();
  });
};
