
module('layer');

(function() {

  var provider = new VECNIK.CartoDB.API(VECNIK.GeoJSON, { user: 'TEST', table: 'TEST' });
  var renderer = new VECNIK.Renderer({ shader: new VECNIK.Shader('') });
  var map = {
    on: function(type, handler, scope) {
      this.listeners[type] = function(e) {
        handler.call(scope, e);
      };
    },
    listeners: {},
    emit: function(type, e) {
      this.listeners[type](e);
    }
  };

  QUnit.testStart(function() {});

  test('Instantiation', function() {
    throws(function() {
      new VECNIK.Layer({});
    }, 'VECNIK.Tile requires a data provider');

    throws(function() {
      new VECNIK.Layer({ renderer: renderer });
    }, 'VECNIK.Tile requires a data provider');

    throws(function() {
      new VECNIK.Layer({ provider: provider });
    }, 'VECNIK.Tile requires a renderer');

    var layer = new VECNIK.Layer({ provider: provider, renderer: renderer });
    equal(layer instanceof VECNIK.Layer, true);
  });

  test('Add collision check bbox', function() {
    var layer = new VECNIK.Layer({ provider: provider, renderer: renderer });
    var type = 'test';
    layer.addBBox(type, { x: 10, y: 10, w: 100, h: 100 });
    equal(layer._qTree[type].length, 1);
  });

  test('Check bbox collision', function() {
    var layer = new VECNIK.Layer({ provider: provider, renderer: renderer });
    var type1 = 'test1';
    var type2 = 'test2';
    var id1 = 1;
    var id2 = 2;

    layer.addBBox(type1, { id: id1, x: 10, y: 10, w: 100, h: 100 });

    // same type, hit
    equal(layer.hasCollision(type1, { id: id2, x: 50, y: 50, w: 75, h: 75 }), true);
    // same type, miss
    equal(layer.hasCollision(type1, { id: id2, x: 150, y: 150, w: 75, h: 75 }), false);
    // different type
    equal(layer.hasCollision(type2, { id: id2, x: 50, y: 50, w: 75, h: 75 }), false);
    // same id, hit
    equal(layer.hasCollision(type1, { id: id1, x: 50, y: 50, w: 75, h: 75 }), false);
  });

  test('Create tile', function() {
    var layer = new VECNIK.Layer({ provider: provider, renderer: renderer });
    layer._map = { getZoom: function() { return 10; }};
    var tile = layer.createTile({ x: 1, y: 2, z: 10 });

    equal(tile instanceof HTMLCanvasElement, true);
  });

}());
