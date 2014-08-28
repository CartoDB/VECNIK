
module('cartodb.sql');

(function() {

  var options = {
    ENABLE_SIMPLIFY: false,
    ENABLE_CLIPPING: false,
    ENABLE_SNAPPING: false,
    ENABLE_FIXING:   false
  };

  var tilePos = { x: 0, y: 0, z: 10 };

  var bboxFilter = 'WHERE the_geom && ST_MakeEnvelope(-180,85.02070774312594,-179.6484375,85.0511287798066, 4326)';

  QUnit.testStart(function() {});

  test('Normal query', function() {
    var sql = VECNIK.CartoDB.SQL('table', tilePos.x, tilePos.y, tilePos.z, options);
    equal(sql, 'SELECT cartodb_id FROM table '+ bboxFilter);
  });

  test('Additional filter', function() {
    options.filter = '(1<2)';
    var sql = VECNIK.CartoDB.SQL('table', tilePos.x, tilePos.y, tilePos.z, options);
    equal(sql, 'SELECT cartodb_id FROM table '+ bboxFilter +' AND (1<2)');
    delete options.filter;
  });

  test('Extra columns', function() {
    options.columns = ['xcol1', 'xcol2'];
    var sql = VECNIK.CartoDB.SQL('table', tilePos.x, tilePos.y, tilePos.z, options);
    equal(sql, 'SELECT cartodb_id,the_geom AS the_geom,"xcol1","xcol2" FROM table '+ bboxFilter);
    delete options.columns;
  });

  test('All columns', function() {
    options.columns = ['*','xcol'];
    var sql = VECNIK.CartoDB.SQL('table', tilePos.x, tilePos.y, tilePos.z, options);
    equal(sql, 'SELECT cartodb_id,* FROM table '+ bboxFilter);
    delete options.columns;
  });

  test('OSM table', function() {
    var sql = VECNIK.CartoDB.SQL('planet', tilePos.x, tilePos.y, tilePos.z, options);
    equal(sql, 'SELECT osm_id AS cartodb_id FROM planet '+ bboxFilter);
  });

}());
