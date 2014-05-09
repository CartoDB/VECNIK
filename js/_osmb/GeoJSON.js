var GeoJSON = {

  // detect winding direction: clockwise or counter clockwise
  getWinding: function(coordinates) {
    var
      x1, y1, x2, y2,
      a = 0,
      i, il;
    for (i = 0, il = coordinates.length-1; i < il; i++) {
      x1 = coordinates[i][0];
      y1 = coordinates[i][1];
      x2 = coordinates[i+1][0];
      y2 = coordinates[i+1][1];
      a += x1*y2 - x2*y1;
    }
    return (a/2) > 0 ? 'CW' : 'CCW';
  },

  toPixelBuffer: function(coordinates, makeCCW) {
    var
      i,
      lat = 1, lon = 0, alt = 2,
      px,
      len = coordinates.length,
      res = [];

    if (coordinates[len-1][lat] !== coordinates[0][lat] || coordinates[len-1][lon] !== coordinates[0][lon]) {
      coordinates.push(coordinates[0]);
      len++;
    }

    var winding = this.getWinding(coordinates);
    if (!(winding === 'CW' ^ !!makeCCW)) {
      coordinates.reverse();
    }

    res = new Int32Array(len*2);

    for (i = 0; i < len; i++) {
      px = geoToPixel(coordinates[i][lat], coordinates[i][lon]);
      res[i*2]   = px.x-ORIGIN_X <<0;
      res[i*2+1] = px.y-ORIGIN_Y <<0;
    }

    return res;
  },

  toPixelPoint: function(coordinates) {
    var
      lat = 1, lon = 0, alt = 2,
      px,
      res = new Int32Array();

    px = geoToPixel(coordinates[lat], coordinates[lon]);
    res[0] = px.x-ORIGIN_X <<0;
    res[1] = px.y-ORIGIN_Y <<0;
    return res;
  },

  getGeometry: function(geometry) {
    var
      i, il, j, jl,
      coordinates = [];
    // TODO: missing a few geometry types
    switch (geometry.type) {
      case 'Point':
        return this.toPixelPoint([geometry.coordinates]);

      case 'Polygon':
        for (i = 0, il = geometry.coordinates.length; i < il; i++) {
          coordinates[i] = this.toPixelBuffer(geometry.coordinates[i], !!i);
        }
        return coordinates;

      case 'MultiPolygon':
        for (j = 0, jl = geometry.coordinates.length; j < jl; j++) {
          coordinates[j] = [];
          for (i = 0, il = geometry.coordinates[j].length; i < il; i++) {
            coordinates[j][i] = this.toPixelBuffer(geometry.coordinates[j][i], !!i);
          }
        }
      return coordinates;

      case 'LineString':
        // TODO: polygons auto-close. avoid it here!
        return this.toPixelBuffer(geometry.coordinates);
    }
  },

  parse: function(collection) {

//    return [{
//      id:          4711,
//      properties:  {},
//      type:        'MultiPolygon',
//      coordinates: [ // multi list
//        [ // polygon
//          [ // outer ring
//            200,200, 400,200, 400,400, 200,400, 200,200 // coordinates
//          ],
//          [ // inner ring
//            250,250, 250,300, 300,300, 300,250, 250,250 // coordinates
//          ]
//        ]
//      ]
//    }];

    var
      i, il, j, jl,
      res = [],
      feature;

    for (i = 0, il = collection.length; i < il; i++) {
      feature = collection[i];
      if (feature.type === 'Feature') {
        if (feature.geometry.type !== 'GeometryCollection') {
          this.addFeature(res, feature, this.getGeometry(feature.geometry));
        } else {
          for (j = 0, jl = feature.geometry.geometries.length; j < jl; j++) {
            this.addFeature(res, feature, this.getGeometry(feature.geometry.geometries[j]));
          }
        }
      }
    }

    return res;
  },

  addFeature: function(res, feature, coordinates) {
    res.push({
      id:          feature.id || feature.properties.id,
      properties:  feature.properties,
      type:        feature.geometry.type,
      coordinates: coordinates
    });
  }
};
