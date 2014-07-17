
module('core');

(function() {

  QUnit.testStart(function() {});

  // doesn't work from command line but browser is fine
  asyncTest('XHR', function() {
    var expectedRes = JSON.stringify({ test: 123 });
    VECNIK.load('test.json', function(res) {
      equal(JSON.stringify(res), expectedRes);
      start();
    });
  });

}());
