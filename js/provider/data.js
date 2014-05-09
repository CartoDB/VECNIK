var Data = {

  currentItemsIndex: {}, // maintain a list of cached items in order to avoid duplicates on tile borders

  items: [],

  cropDecimals: function(num) {
    return parseFloat(num.toFixed(5));
  },

  createClosure: function(cacheKey) {
    var self = this;
    return function(data) {
      var parsedData = self.parse(data);
      Cache.add(parsedData, cacheKey);
      self.addRenderItems(parsedData);
    };
  },

  parse: function(data) {
    if (!data) {
      return [];
    }
    return GeoJSON.parse(data.features);
  },

  resetItems: function() {
    this.items = [];
    this.currentItemsIndex = {};
  },

  addRenderItems: function(items) {
    var i, il, item;
    for (i = 0, il = items.length; i < il; i++) {
      item = items[i];
      if (!this.currentItemsIndex[item.id]) {
        this.currentItemsIndex[item.id] = 1;
        this.items.push(item);
      }
    }
  },

  update: function() {
    this.resetItems();

    var lat, lon,
      parsedData, cacheKey,
      nw = pixelToGeo(ORIGIN_X,       ORIGIN_Y),
      se = pixelToGeo(ORIGIN_X+WIDTH, ORIGIN_Y+HEIGHT),
      sizeLat = DATA_TILE_SIZE,
      sizeLon = DATA_TILE_SIZE*2;

    var bounds = {
      n: ceil( nw.latitude /sizeLat) * sizeLat,
      e: ceil( se.longitude/sizeLon) * sizeLon,
      s: floor(se.latitude /sizeLat) * sizeLat,
      w: floor(nw.longitude/sizeLon) * sizeLon
    };

    for (lat = bounds.s; lat <= bounds.n; lat += sizeLat) {
      for (lon = bounds.w; lon <= bounds.e; lon += sizeLon) {
        lat = this.cropDecimals(lat);
        lon = this.cropDecimals(lon);

        cacheKey = lat +','+ lon;
        if ((parsedData = Cache.get(cacheKey))) {
          this.addRenderItems(parsedData);
        } else {
          xhr(URL, {
            n: this.cropDecimals(lat+sizeLat),
            e: this.cropDecimals(lon+sizeLon),
            s: lat,
            w: lon
          }, this.createClosure(cacheKey));
        }
      }
    }

    Cache.purge();
  }

};
