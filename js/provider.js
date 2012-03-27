
function CartoDBSQLAPI(opts) {
    this.projection = new MercatorProjection();
    this.opts = opts;
    this.base_url = 'http://' + opts.user + ".cartodb.com/api/v2/sql";
}


CartoDBSQLAPI.prototype = new TileManager();

CartoDBSQLAPI.prototype.debug = function(w) {
  if(this.opts.debug) {
    console.log(w);
  }
}

CartoDBSQLAPI.prototype._sql_url = function(sql) {
    var self = this;
    this.debug(sql);
    return this.base_url  + "?q=" + encodeURIComponent(sql) + "&format=geojson&dp=6";
}

CartoDBSQLAPI.prototype.get_tile_data_sql = function(projection, table, x, y, zoom) {
    var bbox = projection.tileBBox(x, y, zoom);
    var geom_column = 'the_geom';
    var id_column = 'cartodb_id';
    var the_geom;
    var TILE_SIZE = 256;
    var tile_pixel_width = TILE_SIZE;
    var tile_pixel_height = TILE_SIZE;

    this.debug('-- ZOOM: ' + zoom);

    var tile_geo_width = bbox[1].lng() - bbox[0].lng();
    var tile_geo_height = bbox[1].lat() - bbox[0].lat();

    var pixel_geo_width = tile_geo_width / tile_pixel_width;
    var pixel_geo_height = tile_geo_height / tile_pixel_height;

    this.debug('-- PIXEL_GEO_SIZE: '
      + pixel_geo_width + ' x ' + pixel_geo_height);

    var pixel_geo_maxsize = Math.max(pixel_geo_width, pixel_geo_height);
    this.debug('-- MAX_SIZE: ' + pixel_geo_maxsize);

    var tolerance = pixel_geo_maxsize / 2;
    this.debug('-- TOLERANCE: ' + tolerance);

    // simplify
    geom_column = 'ST_Simplify("'+geom_column+'", ' + tolerance + ')';

    // TODO: snap to a grid, somewhere ?

    // This is the query bounding box
    var sql_env = "ST_MakeEnvelope("
      + bbox[0].lng() + "," + bbox[0].lat() + ","
      + bbox[1].lng() + "," + bbox[1].lat() + ", 4326)";

    // clip
    var ENABLE_CLIPPING = this.opts.ENABLE_CLIPPING || false;
    if ( ENABLE_CLIPPING ) {
      // we expand the bounding box by a couple of pixels
      geom_column = 'ST_Intersection(' + geom_column
        + ', ST_Expand(' + sql_env + ', ' + pixel_geo_maxsize * 2  + '))';
    }

    var columns = id_column + ',' + geom_column + ' as the_geom';

    // profiling only
    var COUNT_ONLY = 0
    if ( COUNT_ONLY ) {
      columns = 'sum(st_npoints(' + geom_column + ')) as the_geom';
    }

    var sql = "select " + columns +" from " + table;
    sql += " WHERE the_geom && " + sql_env;
    //sql += " LIMIT 1000";

    this.debug('-- SQL: ' + sql);

    return sql;
};


CartoDBSQLAPI.prototype.url = function(coordinates) {
    var projection = this.projection;
    var opts = this.opts;
    var table = opts.table;
    var prj = this.projection;
    var sql = this.get_tile_data_sql(prj, table, coordinates.column, coordinates.row, coordinates.zoom);
    var sql_url = this._sql_url(sql);
    return sql_url;
}

