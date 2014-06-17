
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

/*
  test('should tell when line should be rendered', function() {
    var c = new VECNIK.CartoShader({
      'line-color': '#fff'
    });
    equals(c.needs_render({}, {}, 'LineString'), true);

    var c = new VECNIK.CartoShader({
      'polygon-fill': '#fff'
    });
    equals(c.needs_render({}, {}, 'LineString'), false);

    var c = new VECNIK.CartoShader({
      'line-color': function(data) {
        if (data.lovely > 1) {
          return '#fff';
        }
      }
    });
    expect(c.needs_render({lovely: 0}, {}, 'LineString')).toBeFalsy();
  });
  */

