importScripts('../../vecnik.debug.js');

self.onmessage = function(e) {
  VECNIK.load(e.data.url, 'arraybuffer', function(buffer) {
    self.postMessage(VECNIK.VectorTile.convertForWorker(buffer));
    self.close();
  });
};
