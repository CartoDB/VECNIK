
module('cartoshader');

(function() {

  var shaderLayer;

  QUnit.testStart(function() {
    shaderLayer = new VECNIK.CartoShaderLayer('test', {
      'polygon-fill': '#ffcc00'
    });
  });

  test('create an interactivity shader', function() {
    var hitLayer = shaderLayer.createHitShaderLayer();
    var style;

    style = hitLayer.getStyle({ cartodb_id: 0 });
    equal(style.polygonFill, 'rgb(1,0,0)');

    style = hitLayer.getStyle({ cartodb_id: 1 });
    equal(style.polygonFill, 'rgb(2,0,0)');

    style = hitLayer.getStyle({ cartodb_id: 256 });
    equal(style.polygonFill, 'rgb(1,1,0)');
  });

}());
