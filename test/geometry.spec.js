
module('geometry');

QUnit.testStart(function() {});

test('Geometry types need to be defined', function() {
  equal(VECNIK.Geometry.POINT, 'Point');
  equal(VECNIK.Geometry.LINE, 'LineString');
  equal(VECNIK.Geometry.POLYGON, 'Polygon');
});
