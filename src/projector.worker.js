importScripts('../src/mercator.js');
importScripts('../src/reader/geojson.js');

self.onmessage = function(e) {
  self.postMessage(VECNIK.GeoJSON.convertForWorker(e.data.collection, e.data.tileCoords));
  self.close();
};
