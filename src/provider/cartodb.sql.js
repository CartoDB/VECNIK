
var VECNIK = require('../core/core');

var CartoDB = module.exports = {};

CartoDB.SQL = function(projection, table, x, y, zoom, options) {

  options = options || {
    ENABLE_SIMPLIFY: true,
    ENABLE_CLIPPING: true,
    ENABLE_SNAPPING: true,
    ENABLE_FIXING:   true
  };

  var bbox = projection.tileBBox(x, y, zoom, options.bufferSize);
  var geom_column = '"the_geom"';
  var geom_column_orig = '"the_geom"';
  var id_column = options.idColumn || VECNIK.ID_COLUMN; // though we dont't like the id column to be set manually,
                                                    // it allows us to have a different id column for OSM access
//  var tileSize = L.Browser.retina ? 512 : 256;
  var tileSize = 256;
  var tile_pixel_width = tileSize;
  var tile_pixel_height = tileSize;

  //console.log('-- ZOOM: ' + zoom);

  var tile_geo_width  = bbox[1].lon - bbox[0].lon;
  var tile_geo_height = bbox[1].lat - bbox[0].lat;

  var pixel_geo_width  = tile_geo_width  / tile_pixel_width;
  var pixel_geo_height = tile_geo_height / tile_pixel_height;

  //console.log('-- PIXEL_GEO_SIZE: '
  //  + pixel_geo_width + ' x ' + pixel_geo_height);

  var pixel_geo_maxsize = Math.max(pixel_geo_width, pixel_geo_height);
  //console.log('-- MAX_SIZE: ' + pixel_geo_maxsize);

  var tolerance = pixel_geo_maxsize / 2;
  //console.log('-- TOLERANCE: ' + tolerance);

  // simplify
  if (options.ENABLE_SIMPLIFY) {
    geom_column = 'ST_Simplify('+ geom_column +', '+ tolerance +')';
    // may change type
    geom_column = 'ST_CollectionExtract('+ geom_column +', ST_Dimension('+ geom_column_orig +') + 1)';
  }

  // snap to a pixel grid
  if (options.ENABLE_SNAPPING ) {
    geom_column = 'ST_SnapToGrid('+ geom_column +', '+ pixel_geo_maxsize +')';
    // may change type
    geom_column = 'ST_CollectionExtract('+ geom_column +', ST_Dimension('+ geom_column_orig +') + 1)';
  }

  // This is the query bounding box
  var sql_env = 'ST_MakeEnvelope('+
    bbox[0].lon +','+ bbox[0].lat +','+
    bbox[1].lon +','+ bbox[1].lat +', 4326)';

  var filter = 'the_geom && '+ sql_env;

  if (options.filter) {
    filter += ' AND '+ options.filter;
  }

  // clip
  if (options.ENABLE_CLIPPING) {
    // This is a slightly enlarged version of the query bounding box

    // var sql_env_exp = '('+ sql_env +')';
    var sql_env_exp = 'ST_Expand('+ sql_env +', '+ (pixel_geo_maxsize*120) +')';

    // Also must be snapped to the grid ...
    sql_env_exp = 'ST_SnapToGrid('+ sql_env_exp +','+ pixel_geo_maxsize +')';

    // snap to box
    geom_column = 'ST_Snap('+ geom_column +', '+ sql_env_exp +', '+ pixel_geo_maxsize +')';

    // Make valid (both ST_Snap and ST_SnapToGrid and ST_Expand
    if (options.ENABLE_FIXING) {
      // NOTE: up to PostGIS-2.0.0 beta5 ST_MakeValid did not accept
      //       points nor GeometryCollection objects
      geom_column = 'CASE WHEN ST_Dimension('+
        geom_column +') = 0 OR GeometryType('+
        geom_column +") = 'GEOMETRYCOLLECTION' THEN "+
        geom_column +' ELSE ST_CollectionExtract(ST_MakeValid('+
        geom_column +'), ST_Dimension(' + geom_column_orig +
        ') + 1) END';
    }

    // clip by box
    geom_column = 'ST_Intersection('+ geom_column +', '+ sql_env_exp +')';
  }

  var columns = id_column +','+ geom_column +' as the_geom';
  if (options.columns) {
    columns += ','+ options.columns.join(',') +' ';
  }

  // profiling only
  if (options.COUNT_ONLY) {
    columns = x +' AS x, '+ y +' AS y, SUM(st_npoints('+ geom_column +')) AS the_geom';
  }

  return 'SELECT '+ columns +' FROM '+ table +' WHERE '+ filter; // +' LIMIT 100';
};
