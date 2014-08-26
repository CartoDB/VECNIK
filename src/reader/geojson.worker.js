importScripts('../../vecnik.debug.js');

self.onmessage = function(e) {
  VECNIK.loadJSON(e.data.url, function(data) {
    var metric = VECNIK.Profiler.metric('conversion').start();
    var collection = VECNIK.GeoJSON.convertForWorker(data, e.data.tile);
    self.postMessage({
      collection: collection,
      elapsed: metric.elapsed()
    });
    self.close();
  });
};
