
module('shader');

(function() {

  QUnit.testStart(function() {});

  test('Symbolizer types need to be defined', function() {
    equal(VECNIK.CartoShader.LINE,    'line');
    equal(VECNIK.CartoShader.POLYGON, 'polygon');
    equal(VECNIK.CartoShader.POINT,   'markers');
    equal(VECNIK.CartoShader.TEXT,    'text');
  });

}());
