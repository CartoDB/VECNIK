
module('cartoshader');
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
    equal(shader.apply(ctx, shader.evalStyle({ color: '#ff0000' })), true);
    equal(shader.apply(ctx, shader.evalStyle({ color: 'rgba(0, 0, 0, 0.1)' })), true);
    equal(shader.apply(ctx, shader.evalStyle({ color: 'rgba(0, 0, 0, 0.1)' })), false);
    equal(shader.apply(ctx, shader.evalStyle({ color: '#ff0000' })), true);
    equal(shader.apply(ctx, shader.evalStyle({ color: '#ff0000' })), false);
    equal(shader.apply(ctx, shader.evalStyle({ color: '#fff000' })), true);
  });

  test('should tell when line should be rendered', function() {
    var c = new VECNIK.CartoShader({
      'line-color': '#fff'
    });
    var st = c.evalStyle({})
    equal(c.needsRender('LineString', st), true);
    equal(c.needsRender('LineString', st), true);
    equal(c.needsRender('LineString', st), true);
    equal(c.needsRender('Polygon', st), true);
    equal(c.needsRender('Point', st), false);

    c = new VECNIK.CartoShader({
      'polygon-fill': '#fff'
    });
    var st = c.evalStyle({})
    equal(c.needsRender('LineString', st), false);
    equal(c.needsRender('Point', st), false);
    equal(c.needsRender('Polygon', st), true);

    c = new VECNIK.CartoShader({
      'line-color': function(data) {
        if (data.value > 1) {
          return '#fff';
        }
      }
    });
    equal(c.needsRender('LineString', c.evalStyle({ value: 0 })), false);
    equal(c.needsRender('LineString', c.evalStyle({ value: 0 })), false);

    c = new VECNIK.CartoShader({
      'line-color': function(data, ctx) {
        if (ctx.zoom > 1) {
          return '#fff';
        }
      }
    });
    equal(c.needsRender('LineString', c.evalStyle({ value: 0 })), false);
    equal(c.needsRender('LineString', c.evalStyle({ value: 0 }, { zoom: 1 })), false);
    equal(c.needsRender('LineString', c.evalStyle({ value: 0 }, { zoom: 2 })), true);
  });
