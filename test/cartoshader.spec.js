
module("cartoshader");
var shader, canvas, ctx;

  QUnit.testStart(function( details ) {
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d')
    shader = new VECNIK.CartoShader({
      'point-color': '#ffffff',
      'line-color': function(data) {
        return data.color;
      },
      'line-width': 1,
      'polygon-fill': '#0000ff'
    });
  });

  test('should compile to canvas properties', 2, function() {
    equal(typeof shader._compiled['fillStyle'], 'string');
    equal(typeof shader._compiled['strokeStyle'], 'function');
  });

  test('apply should return true when style was changed',  function() {
    equal(shader.apply(ctx, { color: '#ff0000' }), true);
    equal(shader.apply(ctx, { color: 'rgba(0, 0, 0, 0.1)' }), true);
    equal(shader.apply(ctx, { color: 'rgba(0, 0, 0, 0.1)' }), false);
    equal(shader.apply(ctx, { color: '#ff0000' }), true);
    equal(shader.apply(ctx, { color: '#ff0000' }), false);
    equal(shader.apply(ctx, { color: '#fff000' }), true);
  });

  test('should tell when line should be rendered', function() {
    var c = new VECNIK.CartoShader({
      'line-color': '#fff'
    });
    equal(c.needsRender('LineString', {}, 0), true);
    equal(c.needsRender('LineString', {}, 10), true);
    equal(c.needsRender('LineString', {}, 20), true);
    equal(c.needsRender('Polygon', {}, 0), true);
    equal(c.needsRender('Point', {}, 0), false);

    c = new VECNIK.CartoShader({
      'polygon-fill': '#fff'
    })
    equal(c.needsRender('LineString', {}, 0), false);
    equal(c.needsRender('Point', {}, 0), false);
    equal(c.needsRender('Polygon', {}, 0), true);

    c = new VECNIK.CartoShader({
      'line-color': function(data) {
        if (data.value > 1) {
          return '#fff';
        }
      }
    });
    equal(c.needsRender('LineString', { value: 0 }, 0), false);
    equal(c.needsRender('LineString', { value: 0 }, 1), false);

    c = new VECNIK.CartoShader({
      'line-color': function(data, ctx) {
        if (ctx.zoom > 1) {
          return '#fff';
        }
      }
    });
    equal(c.needsRender('LineString', { }, 0), false);
    equal(c.needsRender('LineString', { }, 2), true);
  });

