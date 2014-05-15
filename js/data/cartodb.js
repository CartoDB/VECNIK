
// consider a singleton

Vecnik.CartoDB = function(opt) {
  this.opt = opt || {};
  this.baseUrl = 'http://'+ this.opt.user +'.cartodb.com/api/v2/sql';
}

var proto = Vecnik.CartoDB.prototype;

proto.debug = function(w) {
  if (this.opt.debug && console) {
    console.log(w);
  }
};

proto.getSql = function(projection, table, x, y, zoom, opt) {
  var bbox = projection.tileBBox(x, y, zoom);
  var geom_column = '"the_geom"';
  var geom_column_orig = '"the_geom"';
  var id_column = 'cartodb_id';
  var tile_pixel_width = Vecnik.TILE_SIZE;
  var tile_pixel_height = Vecnik.TILE_SIZE;

  //console.log('-- ZOOM: ' + zoom);

  var tile_geo_width = bbox[1].lng() - bbox[0].lng();
  var tile_geo_height = bbox[1].lat() - bbox[0].lat();

  var pixel_geo_width = tile_geo_width / tile_pixel_width;
  var pixel_geo_height = tile_geo_height / tile_pixel_height;

  //console.log('-- PIXEL_GEO_SIZE: '
  //  + pixel_geo_width + ' x ' + pixel_geo_height);

  var pixel_geo_maxsize = Math.max(pixel_geo_width, pixel_geo_height);
  //console.log('-- MAX_SIZE: ' + pixel_geo_maxsize);

  var tolerance = pixel_geo_maxsize / 2;
  //console.log('-- TOLERANCE: ' + tolerance);

  // simplify
  if (Vecnik.ENABLE_SIMPLIFY) {
    geom_column = 'ST_Simplify(' + geom_column + ', ' + tolerance + ')';
    // may change type
    geom_column = 'ST_CollectionExtract(' + geom_column + ', ST_Dimension( '
      + geom_column_orig + ') + 1 )';
  }

  // snap to a pixel grid
  if (Vecnik.ENABLE_SNAPPING) {
    geom_column = 'ST_SnapToGrid(' + geom_column + ', '
                  + pixel_geo_maxsize + ')';
    // may change type
    geom_column = 'ST_CollectionExtract(' + geom_column + ', ST_Dimension( '
      + geom_column_orig + ') + 1 )';
  }

  // This is the query bounding box
  var sql_env = 'ST_MakeEnvelope('
    + bbox[0].lng() + ',' + bbox[0].lat() + ','
    + bbox[1].lng() + ',' + bbox[1].lat() + ', 4326)';

  // clip
  if (Vecnik.ENABLE_CLIPPING) {
    // This is a slightly enlarged version of the query bounding box
    var sql_env_exp = 'ST_Expand('+ sql_env +', '+ (pixel_geo_maxsize*2) +')';
    // Also must be snapped to the grid ...
    sql_env_exp = 'ST_SnapToGrid('+ sql_env_exp +','+ pixel_geo_maxsize +')';

    // snap to box
    geom_column = 'ST_Snap(' + geom_column + ', ' + sql_env_exp
        + ', ' + pixel_geo_maxsize + ')';

    // Make valid (both ST_Snap and ST_SnapToGrid and ST_Expand
    if (Vecnik.ENABLE_FIXING ) {
      // NOTE: up to PostGIS-2.0.0 beta5 ST_MakeValid did not accept
      //       points nor GeometryCollection objects
      geom_column = 'CASE WHEN ST_Dimension('
        + geom_column + ') = 0 OR GeometryType('
        + geom_column + ") = 'GEOMETRYCOLLECTION' THEN "
        + geom_column + ' ELSE ST_CollectionExtract(ST_MakeValid('
        + geom_column + '), ST_Dimension(' + geom_column_orig
        + ') + 1 ) END';
    }

    // clip by box
    geom_column = 'ST_Intersection(' + geom_column
      + ', ' + sql_env_exp + ')';
  }

  var columns = id_column + ',' + geom_column + ' as the_geom';
  if (opt.columns) {
    columns += ',';
    columns += opt.columns.join(',')
    columns += ' ';
  }

  return 'SELECT '+ columns +' FROM '+ table +' WHERE the_geom && '+ sql_env;
};

proto.getVectorTileSql = function(table, x, y, zoom) {
//  return this.getSql(new Vecnik.Projection(), table, x, y, zoom, this.opt);
};

proto.getUrl = function(coordinates) {
  var sql = this.getVectorTileSql(this.opt.table, coordinates.column, coordinates.row, coordinates.zoom);
  this.debug(sql);
  return this.baseUrl +'?q='+ encodeURIComponent(sql) +'&format=geojson&dp=6';
};
