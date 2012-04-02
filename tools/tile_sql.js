var MercatorProjection = require('../js/mercator').MercatorProjection;
var CartoDBSQL = require('../js/cartodb.sql').CartoDBSQL;

function data_for_tile(table, x, y, z, callback) {
    var opts =  {
           ENABLE_CLIPPING: true,
           ENABLE_SIMPLIFY: true,
           ENABLE_FIXING: true,
           ENABLE_SNAPPING: true
    };
    var prj = new MercatorProjection();
    var sql = CartoDBSQL(prj, table, x, y, z, opts);
    callback(sql);
}

function parse_range(val) {
  var p = val.split(':');
  return p;
}


if (process.argv.length < 4) {
   console.log("usage: node " + process.argv[1] + " <table> <zoom> [<x>[:<x2>]] [<y>[:<y2>]]")
} else {

   args = process.argv.slice(2)
   var table = args[0];

   var zoom = parseInt(args[1]);
   var ntiles = 1<<zoom;

   var miny = 0;
   var maxy = ntiles-1;

   var minx = 0;
   var maxx = ntiles-1;

   if ( args.length > 2 ) {
    range = args[2].split(':');
    minx = parseInt(range[0]);
    if ( range.length > 1 ) maxx = parseInt(range[1]);
    else maxx = minx;
   }

   if ( args.length > 3 ) {
    range = args[3].split(':');
    miny = parseInt(range[0]);
    if ( range.length > 1 ) maxy = parseInt(range[1]);
    else maxy = miny;
   }


   var logger = function(sql) {
        console.log(sql + ';');
   };

  console.log("-- X range = " + minx + ":" + maxx);
  console.log("-- Y range = " + miny + ":" + maxy);

  for (y=miny; y<=maxy; ++y) {
    for (x=minx; x<=maxx; ++x) {
      data_for_tile(table, x, y, zoom, logger);
    }
  }

} 

