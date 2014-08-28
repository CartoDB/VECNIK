
module('geometry');

(function() {

  QUnit.testStart(function() {});

  test('Geometry types need to be defined', function() {
    equal(VECNIK.Geometry.POINT, 'Point');
    equal(VECNIK.Geometry.LINE, 'LineString');
    equal(VECNIK.Geometry.POLYGON, 'Polygon');
  });

  test('Calculate Centroids', function() {
    var tileSize = 256;
    var tile1Coords = { x: 0, y: 0, z: 10 };
    var tile2Coords = { x: 1, y: 0, z: 10 };

    // parts of a feature, spread across tiles
    var featureParts = [{
      feature: {
        type: 'Polygon',
        coordinates: [[10,13,100,13,100,103,10,103,10,13]]
      },
      tileCoords: tile1Coords,
      tileSize: tileSize
    }, {
      feature: {
        type: 'Polygon',
        coordinates: [[10,13,300,13,300,303,10,303,10,13]]
      },
      tileCoords: tile2Coords,
      tileSize: tileSize
    }];

    equal(VECNIK.Geometry.getCentroid(), undefined);
    deepEqual(VECNIK.Geometry.getCentroid([featureParts[0]]), { x: 55 + (tile1Coords.x*tileSize), y: 58 + (tile1Coords.y*tileSize) });
    deepEqual(VECNIK.Geometry.getCentroid(featureParts), { x: 155 + (tile2Coords.x*tileSize), y: 158 + (tile2Coords.y*tileSize) });

    var tile3Coords = { x: 0, y: 1, z: 10 };

    featureParts.push({
      feature: {
        type: 'Point',
        coordinates: [30,33]
      },
      tileCoords: tile3Coords,
      tileSize: tileSize
    });

    deepEqual(VECNIK.Geometry.getCentroid(featureParts), { x: 30 + (tile3Coords.x*tileSize), y: 33 + (tile3Coords.y*tileSize) });

  });

}());
