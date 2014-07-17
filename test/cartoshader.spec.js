
module('cartoshader');

(function() {

  var shaderLayer;

  QUnit.testStart(function(details) {
    shaderLayer = new VECNIK.CartoShaderLayer({
      'polygon-fill': '#ffcc00'
    });
  });

  test('create an interactivity shader', function() {
    var hitLayer = shaderLayer.createHitShaderLayer('id');
    var style;

    style = hitLayer.getStyle({ id: 0 });
    equal(style.polygonFill, 'rgb(1,0,0)');

    style = hitLayer.getStyle({ id: 1 });
    equal(style.polygonFill, 'rgb(2,0,0)');

    style = hitLayer.getStyle({ id: 256 });
    equal(style.polygonFill, 'rgb(1,1,0)');
  });

}());
