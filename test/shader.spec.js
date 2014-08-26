
module('shader');

(function() {

  QUnit.testStart(function() {});

  test('Symbolizer types need to be defined', function() {
    equal(VECNIK.Shader.LINE,    'line');
    equal(VECNIK.Shader.POLYGON, 'polygon');
    equal(VECNIK.Shader.POINT,   'markers');
    equal(VECNIK.Shader.TEXT,    'text');
  });

}());
