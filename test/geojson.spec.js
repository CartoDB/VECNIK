
module('geojson');

QUnit.testStart(function() {});

/***
test('Should load GeoJSON and return formatted objects', function() {

  VECNIK.GeoJSON.load = function(url, tileCoords, projection, callback) {
//  if (!VECNIK.GeoJSON.WEBWORKERS || typeof Worker === undefined) {

    if (typeof Worker === undefined) {
      VECNIK.load(url, function(collection) {
        callback(_convertAndReproject(collection, projection, tileCoords));
      });
    } else {
      var worker = new Worker('../src/reader/geojson.worker.js');
    }

//  cartodbApi.load({ x:x, y:y, z:z }, callback);
//  // callback is called
  };

});

***/