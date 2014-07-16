
module('cartoshader');

var shader;

QUnit.testStart(function(details) {
  shader = new VECNIK.CartoShaderLayer({
    'point-color': '#ffffff',
    'line-color': function(data) {
      return data.color;
    },
    'line-width': 1,
    'polygon-fill': '#0000ff'
  });
});

test('create an interactivity shader', function() {
  var hit = shader.hitShader('id');

  var style = hit.getStyle({ id: 0 });
  equal(style.polygonFill, 'rgb(1,0,0)');

  style = hit.getStyle({ id: 1 });
  equal(style.polygonFill, 'rgb(2,0,0)');

  style = hit.getStyle({ id: 256 });
  equal(style.polygonFill, 'rgb(1,1,0)');
});
