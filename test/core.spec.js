
module('core');

(function() {

  QUnit.testStart(function() {});

  // doesn't work from command line but browser is fine
  asyncTest('JSON XHR', function() {
    var expectedRes = JSON.stringify({ test: 123 });
    VECNIK.loadJSON('test.json', function(res) {
      equal(JSON.stringify(res), expectedRes);
      start();
    });
  });

  asyncTest('Binary XHR', function() {
    VECNIK.loadBinary('test.pbf', function(res) {
      equal(res instanceof ArrayBuffer && res.byteLength === 0, true);
      start();
    });
  });

}());
