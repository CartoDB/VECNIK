
module('reader.geojson');

(function() {

  var geojson = {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": {},
        "geometry": {
          "type": "Point",
          "coordinates": [13.37585,52.58302]
        }
      },
      {
        "type": "Feature",
        "properties": {},
        "geometry": {
          "type": "LineString",
          "coordinates": [
            [13.26049,52.42754],
            [13.59558,52.56800],
            [13.45275,52.75624]
          ]
        }
      },
      {
        "type": "Feature",
        "properties": {},
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [12.87597,52.57634],
            [12.87597,52.76621],
            [13.24401,52.76621],
            [12.87597,52.57634]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": {},
        "geometry": {
          "type": "MultiPoint",
          "coordinates": [
            [13.37585,52.58302],
            [13.37599,52.58399]
          ]
        }
      },
      {
        "type": "Feature",
        "properties": {},
        "geometry": {
          "type": "MultiLineString",
          "coordinates": [
            [
              [13.26049,52.42754],
              [13.59558,52.56800],
              [13.45275,52.75624]
            ],
            [
              [13.26099,52.42799],
              [13.59599,52.56899],
              [13.45299,52.75699]
            ]
          ]
        }
      },
      {
        "type": "Feature",
        "properties": {},
        "geometry": {
          "type": "MultiPolygon",
          "coordinates": [
            [[
              [12.87597,52.57634],
              [12.87597,52.76621],
              [13.24401,52.76621],
              [12.87597,52.57634]
            ]],
            [[
              [12.87599,52.57699],
              [12.87599,52.76699],
              [13.24499,52.76699],
              [12.87599,52.57699]
            ]]
          ]
        }
      }
    ]
  };

  QUnit.testStart(function() {});

  test('Convert', function() {
    var data = VECNIK.GeoJSON._convertAndReproject(geojson, { x: 1, y: 1, z: 10 });
  });

}());
