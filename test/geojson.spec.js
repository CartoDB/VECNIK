
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
//  module('geojson');
//
//  test('parseGeoJSON', function() {
//    var g = vecnik.geo().parseGeoJSON(JSON.parse(geojson).features[0].geometry);
//    equal(g.children().length, 1)
//    ok(g.children()[0].x().length > 0)
//  });
//
//  test('parseGeoJSON with features', function() {
//    var g = vecnik.geo().parseGeoJSON(JSON.parse(geojson));
//    equal(g.children().length, 2)
//  });

***/