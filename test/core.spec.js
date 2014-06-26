
module('core');

QUnit.testStart(function() {});

test('Geometry types need to be defined in VECNIK.Geometry.*', function() {
  equal(VECNIK.Geometry.POINT, 'Point');
  equal(VECNIK.Geometry.LINE, 'LineString');
  equal(VECNIK.Geometry.POLYGON, 'Polygon');
});

/*
asyncTest('XHR', function(assert) {
      assert.ok(true, 'video has loaded and is ready to play');
    QUnit.start();

  VECNIK.load('test.json', function(res) {

//    equal(res, {test:123});
//    console.log(res)
  });
});
*/