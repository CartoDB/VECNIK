importScripts('../../vecnik.debug.js');

self.onmessage = function(e) {
  VECNIK.load(e.data.url, 'json', function(collection) {
    self.postMessage(VECNIK.GeoJSON.convertForWorker(collection, e.data.tile));
    self.close();
  });
};
