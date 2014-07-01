
module('core');

QUnit.testStart(function() {});

test('Geometry types need to be defined in VECNIK.Geometry.*', function() {
  equal(VECNIK.Geometry.POINT, 'Point');
  equal(VECNIK.Geometry.LINE, 'LineString');
  equal(VECNIK.Geometry.POLYGON, 'Polygon');
});

asyncTest('XHR', 1, function() {
  VECNIK.load('test.json', function(res) {
    equal(res, {test:123});
  });
});
