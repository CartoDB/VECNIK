  Layer.VERSION     = VERSION;
  Layer.ATTRIBUTION = ATTRIBUTION;

  function init(map, url) {
    URL = url;
    Canvas.create();
    var layer = new Layer(map); // needs to be done before loading data in order to have proper map position
    Data.update();
    return layer;
  }

  return function(map, url) {
    return init(map, url);
  };

}());
