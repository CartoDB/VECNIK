
module('core');

QUnit.testStart(function() {});

asyncTest('XHR', function() {
  var expectedRes = JSON.stringify({ test: 123 });
  VECNIK.load('test.json', function(res) {
    equal(JSON.stringify(res), expectedRes);
    start();
  });
});
