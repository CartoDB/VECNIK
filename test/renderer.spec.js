
module('renderer');

var renderer;

QUnit.testStart(function(details) {
  var shader = new VECNIK.CartoShader(
    '#layer::polygon {\n'+
    '  polygon-fill: #000;\n'+
    '}\n\n'+
    '#layer::line {\n'+
    '  line-color: #fff;\n'+
    '}\n\n'+
    '#layer::text {\n'+
    '  text-name: test;\n'+
    '}\n\n'+
    '#layer::marker {\n'+
    '  marker-width: 10px;\n'+
    '}'
  );

  renderer = new VECNIK.Renderer({ shader: shader });
});

test('should tell when geometry should be rendered', function() {
  var tile = {
    getLayer: function() {
      return {
        getCentroid: function() {
          return { x:0, y:0 };
        }
      };
    },
    getCoords: function() {
      return { x:0, y:0, z:0 };
    }
  };

  var canvas = {
    clear: function() {},
    setStyle: function() {},
    drawCircle: function() {},
    drawLine: function() {},
    drawPolygon: function() {},
    setFont: function() {},
    drawText: function() {}
  };

  var collection = [
    { type: VECNIK.Geometry.POINT,   groupId: 'id-'+ VECNIK.Geometry.POINT,   coordinates: [0,1], properties: {}},
    { type: VECNIK.Geometry.LINE,    groupId: 'id-'+ VECNIK.Geometry.LINE,    coordinates: [[0,1], [2,3]], properties: {}},
    { type: VECNIK.Geometry.POLYGON, groupId: 'id-'+ VECNIK.Geometry.POLYGON, coordinates: [[[0,1], [2,3], [0,1]]], properties: {}}
  ];

  renderer.render(tile, canvas, collection, {});

//    var c = new VECNIK.CartoShaderLayer({
//      'line-color': '#fff'
//    });
//    var st = c.evalStyle({});
//    equal(c.needsRender('line', st), true);
//    equal(c.needsRender('line', st), true);
//    equal(c.needsRender('line', st), true);
//    equal(c.needsRender('polygon', st), true);
//    equal(c.needsRender('markers', st), true);

//    c = new VECNIK.CartoShaderLayer({
//      'polygon-fill': '#fff'
//    });
//    var st = c.evalStyle({});
//    equal(c.needsRender('line', st), false);
//    equal(c.needsRender('markers', st), false);
//    equal(c.needsRender('polygon', st), true);
//    equal(c.needsRender('markers', st), false);

//    c = new VECNIK.CartoShaderLayer({
//      'marker-width': 10
//    });
//    st = c.evalStyle({});
//    equal(c.needsRender('markers', st), true);

//    c = new VECNIK.CartoShaderLayer({
//      'line-color': function(data) {
//        if (data.value > 1) {
//          return '#fff';
//        }
//      }
//    });
//    equal(c.needsRender('line', c.evalStyle({ value: 0 })), false);
//    equal(c.needsRender('line', c.evalStyle({ value: 0 })), false);

//    c = new VECNIK.CartoShaderLayer({
//      'line-color': function(data, ctx) {
//        if (ctx.zoom > 1) {
//          return '#fff';
//        }
//      }
//    });
//    equal(c.needsRender('line', c.evalStyle({ value: 0 })), false);
//    equal(c.needsRender('line', c.evalStyle({ value: 0 }, { zoom: 1 })), false);
//    equal(c.needsRender('line', c.evalStyle({ value: 0 }, { zoom: 2 })), true);
});
