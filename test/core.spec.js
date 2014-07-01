
module('core');

QUnit.testStart(function() {});

asyncTest('XHR', 1, function() {
  VECNIK.load('test.json', function(res) {
    equal(res, {test:123});
  });
});
