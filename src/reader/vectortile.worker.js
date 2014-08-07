importScripts('../../vecnik.debug.js');

self.onmessage = function(e) {
  VECNIK.loadBinary(e.data.url, function(buffer) {
    self.postMessage(VECNIK.VectorTile.convertForWorker(buffer, e.data.tile));
    self.close();
  });
};
