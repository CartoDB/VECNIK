
module('canvas');

(function() {

  var canvas, finishCalled = false;

  QUnit.testStart(function() {
    canvas = new VECNIK.Canvas({ size: 50 });

    var canvas_finishBatch = canvas._finishBatch;

    canvas._finishBatch = function() {
      finishCalled = true;
      canvas_finishBatch.call(canvas);
    };
  });

  test('batch operation should restart when style changes',  function() {
    var operation = 'test';
    var strokeFillOrder = 'S';

    canvas.setStyle('strokeStyle', '#ffffff');

    canvas._finishBatch();
    canvas._beginBatch(operation, strokeFillOrder);
    equal(canvas._operation, operation);

    canvas.setStyle('strokeStyle', '#ff0000');
    equal(canvas._operation, null);

    canvas._finishBatch();
    canvas.setStyle('strokeStyle', 'rgba(0, 0, 0, 0.1)');
    canvas._beginBatch(operation, strokeFillOrder);
    canvas.setStyle('strokeStyle', 'rgba(0, 0, 0, 0.1)');
    equal(canvas._operation, operation);

    canvas.setStyle('strokeStyle', '#ff0000');
    equal(canvas._operation, null);
  });

  test('batch operation should restart when stroke/fill order changes',  function() {
    var operation = 'test';

    canvas._beginBatch(operation, 'F');

    finishCalled = false;

    canvas._beginBatch(operation, 'F');
    equal(finishCalled, false);

    canvas._beginBatch(operation, 'S');
    equal(finishCalled, true);

    finishCalled = false;

    canvas._beginBatch(operation, 'FS');
    equal(finishCalled, true);
  });

  test('batch operation should restart when geometry type changes',  function() {
    var strokeFillOrder = 'S';

    canvas._beginBatch('polygon', strokeFillOrder);

    finishCalled = false;

    canvas._beginBatch('polygon', strokeFillOrder);
    equal(finishCalled, false);

    canvas._beginBatch('line', strokeFillOrder);
    equal(finishCalled, true);

    finishCalled = false;

    canvas._beginBatch('point', strokeFillOrder);
    equal(finishCalled, true);
  });

}());
