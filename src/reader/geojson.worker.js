importScripts('../../vecnik.debug.js');

self.onmessage = function(e) {
  VECNIK.loadJSON(e.data.url, function(collection) {
    self.postMessage(VECNIK.GeoJSON.convertForWorker(collection, e.data.tile));
    self.close();
  });
};
