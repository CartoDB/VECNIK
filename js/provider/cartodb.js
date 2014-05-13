
function CartoDbApi(opt) {
  this.opt = opt || {};
//  this.opt.ENABLE_SIMPLIFY = Vecnik.ENABLE_SIMPLIFY;
//  this.opt.ENABLE_SNAPPING = Vecnik.ENABLE_SNAPPING;
//  this.opt.ENABLE_CLIPPING = Vecnik.ENABLE_CLIPPING;
//  this.opt.ENABLE_FIXING   = Vecnik.ENABLE_FIXING;

  this.opt.ENABLE_SIMPLIFY = false;
  this.opt.ENABLE_SNAPPING = false;
  this.opt.ENABLE_CLIPPING = false;
  this.opt.ENABLE_FIXING   = false;

  this.baseUrl = 'http://'+ opt.user +'.cartodb.com/api/v2/sql';
}

var proto = CartoDbApi.prototype;

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
  var TILE_SIZE = 256;
  var tile_pixel_width = TILE_SIZE;
  var tile_pixel_height = TILE_SIZE;

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
  var ENABLE_SIMPLIFY = opt.ENABLE_SIMPLIFY;
  if ( ENABLE_SIMPLIFY ) {
    geom_column = 'ST_Simplify(' + geom_column + ', ' + tolerance + ')';
    // may change type
    geom_column = 'ST_CollectionExtract(' + geom_column + ', ST_Dimension( '
      + geom_column_orig + ') + 1 )';
  }

  // snap to a pixel grid
  var ENABLE_SNAPPING = opt.ENABLE_SNAPPING;
  if ( ENABLE_SNAPPING ) {
    geom_column = 'ST_SnapToGrid(' + geom_column + ', '
                  + pixel_geo_maxsize + ')';
    // may change type
    geom_column = 'ST_CollectionExtract(' + geom_column + ', ST_Dimension( '
      + geom_column_orig + ') + 1 )';
  }

  // This is the query bounding box
  var sql_env = "ST_MakeEnvelope("
    + bbox[0].lng() + "," + bbox[0].lat() + ","
    + bbox[1].lng() + "," + bbox[1].lat() + ", 4326)";

  // clip
  var ENABLE_CLIPPING = opt.ENABLE_CLIPPING;

  if (ENABLE_CLIPPING) {
    // This is a slightly enlarged version of the query bounding box
    var sql_env_exp = 'ST_Expand('+ sql_env +', '+ (pixel_geo_maxsize*2) +')';
    // Also must be snapped to the grid ...
    sql_env_exp = 'ST_SnapToGrid('+ sql_env_exp +','+ pixel_geo_maxsize +')';

    // snap to box
    geom_column = 'ST_Snap(' + geom_column + ', ' + sql_env_exp
        + ', ' + pixel_geo_maxsize + ')';

    // Make valid (both ST_Snap and ST_SnapToGrid and ST_Expand
    var ENABLE_FIXING = opt.ENABLE_FIXING;
    if ( ENABLE_FIXING ) {
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
  if(opt.columns) {
      columns += ',';
      columns += opt.columns.join(',')
      columns += ' ';
  }

  // profiling only
  var COUNT_ONLY = opt.COUNT_ONLY || false;
  if ( COUNT_ONLY ) {
    columns = x +' as x, '+ y +' as y, sum(st_npoints('+ geom_column +')) as the_geom';
  }

  return 'SELECT '+ columns +' FROM '+ table +' WHERE the_geom && '+ sql_env;
};

proto.getVectorTileSql = function(table, x, y, zoom) {
  var projection = new Vecnik.MercatorProjection();
  return this.getSql(projection, table, x, y, zoom, this.opt);
};

proto.getUrl = function(coordinates) {
  var sql = this.getVectorTileSql(this.opt.table, coordinates.column, coordinates.row, coordinates.zoom);
  this.debug(sql);
  return this.baseUrl +'?q='+ encodeURIComponent(sql) +'&format=geojson&dp=6';
};
