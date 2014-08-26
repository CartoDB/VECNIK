importScripts('../../vecnik.debug.js');

self.onmessage = function(e) {
  VECNIK.loadBinary(e.data.url, function(buffer) {
    var metric = VECNIK.Profiler.metric('conversion').start();
    var collection = VECNIK.VectorTile.convertForWorker(buffer);
    self.postMessage({
      collection: collection,
      elapsed: metric.elapsed()
    });
    self.close();
  });
};
