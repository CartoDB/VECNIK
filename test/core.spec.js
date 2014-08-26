
module('core');

(function() {

  QUnit.testStart(function() {});

  // doesn't work from command line but browser is fine
  asyncTest('JSON XHR', function() {
    var expectedRes = { test: 123 };
    VECNIK.loadJSON('data/test.json', function(res) {
      deepEqual(res, expectedRes);
      start();
    });
  });

  asyncTest('Binary XHR', function() {
    VECNIK.loadBinary('data/test.pbf', function(res) {
      equal(res instanceof ArrayBuffer && res.byteLength === 0, true);
      start();
    });
  });

  asyncTest('Load images', function() {
    VECNIK.loadImage('data/test.jpg', function(img) {
      equal(img instanceof Image, true);
      start();
    });
  });

}());
