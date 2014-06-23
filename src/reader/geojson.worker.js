importScripts('../../src/core/core.js');
importScripts('../../src/core/events.js');
importScripts('../../src/mercator.js');
importScripts('../../src/reader/geojson.js');

self.onmessage = function(e) {
  self.type = 'WOR'
  VECNIK.load(e.data.url)
    .on('load', function(collection) {
      self.postMessage(VECNIK.GeoJSON.convertForWorker(collection, e.data.tileCoords));
      self.close();
    });
};
