
module("cartoshader");

  test('should compile to canvas properties', function() {
    var c = new VECNIK.CartoShader({
      'point-color': '#FFF',
      'line-color': function(data) {
        return data.color;
      },
      'line-width': '1',
      'polygon-fill': '#00F'
    });

    equal(typeof c._compiled['fillStyle'], 'string');
    equal(typeof c._compiled['strokeStyle'], 'function');
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

