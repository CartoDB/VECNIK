
module('renderer');

(function() {

  var tile, canvas, collection,
    circleDone = 0, lineDone = 0, polygonDone = 0, textDone = 0;

  QUnit.testStart(function() {
    tile = {
      getLayer: function() {
        return {
          getCentroid: function() {
            return { x:0, y:0 };
          },
          hasCollision: function() {
            return false;
          },
          addBBox: function() {}
        };
      },
      getCoords: function() {
        return { x:0, y:0, z:0 };
      },
      getSize: function() {
        return 256;
      }
    };

    canvas = {
      clear: function() {},
      setStyle: function() {},
      drawCircle: function() {
        circleDone++;
      },
      drawLine: function() {
        lineDone++;
      },
      drawPolygon: function() {
        polygonDone++;
      },

      setFont: function() {},
      drawText: function() {
        textDone++;
      },
      finishAll: function() {}
    };

    collection = [
      { type: VECNIK.Geometry.POINT,   id: 123, coordinates: [0,1], properties: {}},
      { type: VECNIK.Geometry.LINE,    id: 456, coordinates: [[0,1], [2,3]], properties: {}},
      { type: VECNIK.Geometry.POLYGON, id: 789, coordinates: [[[0,1], [2,3], [0,1]]], properties: {}}
    ];
  });

  var tile, canvas, collection;

  test('should render as text', function() {
    var renderer = new VECNIK.Renderer({
      shader: new VECNIK.CartoShader(
        '#layer {\n'+
        '  text-name: test;\n'+
        '}'
      )
    });

    textDone = 0; polygonDone = 0; lineDone = 0; circleDone = 0;
    renderer.render(tile, canvas, collection, {});
    equal(textDone, 3);
    equal(polygonDone, 0);
    equal(lineDone, 0);
    equal(circleDone, 0);
  });

  test('should render as polygon', function() {
    var renderer = new VECNIK.Renderer({
      shader: new VECNIK.CartoShader(
        '#layer {\n'+
        '  polygon-fill: #000;\n'+
        '}'
      )
    });
    textDone = 0; polygonDone = 0; lineDone = 0; circleDone = 0;
    renderer.render(tile, canvas, collection, {});
    equal(textDone, 0);
    equal(polygonDone, 1);
    equal(lineDone, 0);
    equal(circleDone, 0);
  });

  test('should render as line', function() {
    var renderer = new VECNIK.Renderer({
      shader: new VECNIK.CartoShader(
        '#layer {\n'+
        '  line-color: #fff;\n'+
        '}'
      )
    });
    textDone = 0; polygonDone = 0; lineDone = 0; circleDone = 0;
    renderer.render(tile, canvas, collection, {});
    equal(textDone, 0);
    equal(polygonDone, 0);
    equal(lineDone, 3);
    equal(circleDone, 0);
  });

  test('should render as circle', function() {
    var renderer = new VECNIK.Renderer({
      shader: new VECNIK.CartoShader(
        '#layer {\n'+
        '  marker-fill: #ffcc00;\n'+
        '  marker-width: 10px;\n'+
        '}'
      )
    });
    textDone = 0; polygonDone = 0; lineDone = 0; circleDone = 0;
    renderer.render(tile, canvas, collection, {});
    equal(textDone, 0);
    equal(polygonDone, 0);
    equal(lineDone, 0);
    equal(circleDone, 3);
  });

  test('should not render at all', function() {
    var renderer = new VECNIK.Renderer({
      shader: new VECNIK.CartoShader(
        '#layer {}'
      )
    });
    textDone = 0; polygonDone = 0; lineDone = 0; circleDone = 0;
    renderer.render(tile, canvas, collection, {});
    equal(textDone, 0);
    equal(polygonDone, 0);
    equal(lineDone, 0);
    equal(circleDone, 0);
  });

}());
