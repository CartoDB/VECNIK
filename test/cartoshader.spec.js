
module('cartoshader');

var shader;

QUnit.testStart(function(details) {
  shader = new VECNIK.CartoShader(
    '#layer {\n'+
    '  polygon-fill: rgba(0, 0, 0, 0.3);\n'+
    '  line-color: white;\n'+
    '  line-width: 4;\n'+
    '  [numfloors > 10] {\n'+
    '    polygon-fill: rgba(255, 0, 0, 0.7);\n'+
    '  }\n'+
    '}'
  );
});

test('create an interactivity shader', function() {
  var hitShader = shader.createHitShader('id');
  var hitLayer = hitShader.getLayers()[0];
  var style;

  style = hitLayer.getStyle({ id: 0 });
  equal(style.polygonFill, 'rgb(1,0,0)');

  style = hitLayer.getStyle({ id: 1 });
  equal(style.polygonFill, 'rgb(2,0,0)');

  style = hitLayer.getStyle({ id: 256 });
  equal(style.polygonFill, 'rgb(1,1,0)');
});
