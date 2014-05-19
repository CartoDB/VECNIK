
Vecnik.Data = function(projection, provider) {
  this.projection = projection;
  this.cache      = new Vecnik.Cache();
  this.provider   = provider;
};

var proto = Vecnik.Data.prototype;

proto.currentItemsIndex = {}; // maintain a list of cached items in order to avoid duplicates on tile borders
proto.items = [];
proto.tileSize = 0.0075;

proto.cropDecimals = function(num) {
  return parseFloat(num.toFixed(5));
};

proto.createClosure = function(cacheKey) {
  var self = this;
  return function(data) {
    var parsedData = self.parse(data);
    this.cache.add(parsedData, cacheKey);
    self.addRenderItems(parsedData);
  };
};

proto.parse = function(data) {
  if (!data) {
    return [];
  }
  return GeoJSON.parse(data.features);
};

proto.addRenderItems = function(items) {
  var i, il, item;
  for (i = 0, il = items.length; i < il; i++) {
    item = items[i];
    if (!this.currentItemsIndex[item.id]) {
      this.currentItemsIndex[item.id] = 1;
      this.items.push(item);
    }
  }
};

proto.update = function() {
  this.currentItemsIndex = {};
  this.items = [];

  var
    lat, lon,
    parsedData, cacheKey,
    origin = this.projection.origin,
    nw = this.projection.pixelToGeo(origin.x, origin.y),
//      se = this.projection.pixelToGeo(origin.x+this.canvas.width, origin.y+this.canvas.height);
//TODO: not useful to access canvas like this
    se = this.projection.pixelToGeo(origin.x+800, origin.y+600);


// TODO: current offset is missing
  var bounds = {
    n: Math.ceil( nw.latitude /this.tileSize) * this.tileSize,
    e: Math.ceil( se.longitude/this.tileSize) * this.tileSize,
    s: Math.floor(se.latitude /this.tileSize) * this.tileSize,
    w: Math.floor(nw.longitude/this.tileSize) * this.tileSize
  };

  for (lat = bounds.s; lat <= bounds.n; lat += this.tileSize) {
    for (lon = bounds.w; lon <= bounds.e; lon += this.tileSize) {
      lat = this.cropDecimals(lat);
      lon = this.cropDecimals(lon);

      cacheKey = lat +','+ lon;
      if ((parsedData = this.cache.get(cacheKey))) {
        this.addRenderItems(parsedData);
      } else {
        new Vecnik.Request(this.provider.getUrl(x, y, z), {
          n: this.cropDecimals(lat+this.tileSize),
          e: this.cropDecimals(lon+this.tileSize),
          s: lat,
          w: lon
        }, this.createClosure(cacheKey));
      }
    }
  }

  this.cache.purge();
};
