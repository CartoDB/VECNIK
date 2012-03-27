
function Profiler(name){
  this.t0 = 0;
  this.unit = '';
}
Profiler.prototype.start = function(unit) {
  this.t0 = new Date().getTime();
  this.unit =  unit || '';
}
Profiler.prototype.end= function() {
   var t = new Date().getTime() - this.t0;
   //console.log("PROFILE - " + this.unit + ":" + t);
   return t;
}
//========================================
// tile model 
//========================================
function Tile(x, y, zoom) { 
  this.x = x;
  this.y = y;
  this.zoom = zoom;
  this.on('change', this.precache.bind(this))
  this.stats = {
    conversion_time: 0,
    vertices: 0,
    primitive_count: 0
  }
  this.profiler = new Profiler('tile');
}

Tile.prototype = new Model();
Tile.prototype.key = function() {
  return [this.x, this.y, this.zoom].join('-');
}

Tile.prototype.geometry = function() {
  return this.data.features;
}

Tile.prototype.precache = function() {
  this.profiler.start('conversion_time');
  var primitives = this.data.features;
  this.stats.vertices = 0;
  for(var i = 0; i < primitives.length; ++i) {
      var p = primitives[i];
      var converted = this.convert_geometry(p.geometry, this.zoom, this.x, this.y);
      if(converted != null) {
         p.geometry.projected = converted;
      } else {
         //console.log("problem converting geometries");
      }
  }
  this.stats.primitive_count = primitives.length;
  this.stats.conversion_time = this.profiler.end();
  this.emit('geometry_ready');
}

Tile.prototype.convert_geometry = function(geometry, zoom, x, y) {
    var self = this;
    var latlng = new LatLng(0, 0);
    var prj = self.projector;
    function map_latlon(ll, x, y, zoom) {
        //latlng = new LatLng(latlng[1], latlng[0]);
        latlng.latitude  = ll[1];
        latlng.longitude = ll[0];
        self.stats.vertices++;
        var point =  prj.latLngToTilePoint(latlng, x, y, zoom);
        //point.x = point.x >> 0;
        //point.y = point.y >> 0;
        return point;
    }

    var primitive_conversion = this.primitive_conversion = {
        'LineString': function(x, y, zoom, coordinates) {
              var converted = [];
              var pc = primitive_conversion['Point'];
              for(var i=0; i < coordinates.length; ++i) {
                  converted.push(pc(x, y, zoom, coordinates[i]));
              }
              return converted;
        },

        'Point': function(x, y, zoom, coordinates) {
            return map_latlon(coordinates, x, y, zoom);
        },
        'MultiPoint': function(x, y,zoom, coordinates) {
              var converted = [];
              var pc = primitive_conversion['Point'];
              for(var i=0; i < coordinates.length; ++i) {
                  converted.push(pc(x, y, zoom, coordinates[i]));
              }
              return converted;
        },
        //do not manage inner polygons!
        'Polygon': function(x, y, zoom, coordinates) {
             if(coordinates[0]) {
               var coords = [];
                for(var i=0; i < coordinates[0].length; ++i) {
                  coords.push(map_latlon(coordinates[0][i], x, y, zoom));
               }
               return [coords];
             }
             return null;
        },
        'MultiPolygon': function(x, y, zoom, coordinates) {
              var polys = [];
              var poly;
              var pc = primitive_conversion['Polygon'];
              for(var i=0; i < coordinates.length; ++i) {
                  poly = pc(x, y, zoom, coordinates[i]);
                  if(poly)
                    polys.push(poly);
              }
              return polys;
        }
    };
    var conversor = this.primitive_conversion[geometry.type];
    if(conversor) {
        return conversor(x, y , zoom, geometry.coordinates);
    }

};

//========================================
// tile manager
//========================================

function TileManager(dataProvider) {
  this.tiles = {};
  this.projector = new MercatorProjection();
  this.dataProvider = dataProvider;
}

TileManager.prototype.tileIndex= function(coordinates) {
    return coordinates.toKey();
}

TileManager.prototype.get = function(coordinates) {
  return this.tiles[this.tileIndex(coordinates)];
}

TileManager.prototype.destroy= function(coordinates) {
  var tile = this.tiles[this.tileIndex(coordinates)];
  tile.destroy();
  console.log("removing " + this.tileIndex(coordinates));
  delete this.tiles[this.tileIndex(coordinates)];

}
TileManager.prototype.add = function(coordinates) {
  console.log("adding" + this.tileIndex(coordinates));
  var tile = this.tiles[this.tileIndex(coordinates)] = new Tile(
      coordinates.column, 
      coordinates.row, 
      coordinates.zoom
  );
  tile.projector = this.projector;
  get(this.dataProvider.url(coordinates), function(data) {
      tile.set(data);
  });
  return tile;
}


function Renderer() {
    var self = this;
    var primitive_render = this.primitive_render = {
        'Point': function(ctx, coordinates) {
                  ctx.save();
                  var radius = 2;
                  var p = coordinates;
                  ctx.translate(p.x, p.y);
                  ctx.beginPath();
                  ctx.arc(radius, radius, radius, 0, Math.PI * 2, true);
                  ctx.closePath();
                  ctx.fill();
                  ctx.stroke();
                  ctx.restore();
        },
        'MultiPoint': function(ctx, coordinates) {
              var prender = primitive_render['Point'];
              for(var i=0; i < coordinates.length; ++i) {
                  prender(ctx, zoom, coordinates[i]);
              }
        },
        'Polygon': function(ctx, coordinates) {
              ctx.beginPath();
              var p = coordinates[0][0];
              ctx.moveTo(p.x, p.y);
              for(var i=0; i < coordinates[0].length; ++i) {
                p = coordinates[0][i];
                ctx.lineTo(p.x, p.y);
             }
             ctx.closePath();
             ctx.fill();
             ctx.stroke();
        },
        'MultiPolygon': function(ctx, coordinates) {
              var prender = primitive_render['Polygon'];
              for(var i=0; i < coordinates.length; ++i) {
                  prender(ctx, coordinates[i]);
              }
        },
        'LineString': function(ctx, coordinates) {
              ctx.beginPath();
              var p = coordinates[0];
              ctx.moveTo(p.x, p.y);
              for(var i=0; i < coordinates.length; ++i) {
                p = coordinates[i];
                ctx.lineTo(p.x, p.y);
             }
             ctx.stroke();
        }
    };
}
Renderer.prototype.render = function(ctx, primitives, zoom, shader) {
  var primitive_render = this.primitive_render;
  ctx.canvas.width = ctx.canvas.width;
  if(primitives.length) {
      for(var i = 0; i < primitives.length; ++i) {
          var renderer = primitive_render[primitives[i].geometry.type];
          if(renderer) {
              // render visible tile
              var render_context = {
                  zoom: zoom,
                  id: i
              };
              if(shader)
                shader.apply(ctx, primitives[i].properties, render_context);
              renderer(ctx, primitives[i].geometry.projected);
          }
      }
  }
};

//========================================
// Canvas tile view 
//========================================
function CanvasTileView(tile, shader) {
    this.tileSize = new MM.Point(256, 256)
    var canvas = document.createElement('canvas');
    canvas.width = this.tileSize.x;
    canvas.height = this.tileSize.y;
    this.ctx = canvas.getContext('2d');

    var backCanvas = document.createElement('canvas');
    backCanvas.width = this.tileSize.x;
    backCanvas.height = this.tileSize.y;
    this.backCtx = backCanvas.getContext('2d');
    this.backCanvas = backCanvas;

    this.el = canvas;
    this.id = tile.key();
    this.el.setAttribute('id', tile.key());
    var self = this;
    this.tile = tile;
    var render =  function(){self.render();};
    tile.on('geometry_ready', render);

    // shader
    this.shader = shader;
    if(shader) {
        shader.on('change', render);
    }
    this.renderer = new Renderer();

    this.profiler = new Profiler('tile_render');
    this.stats = {
      rendering_time: 0
    }
}

CanvasTileView.prototype.remove = function() {
}

CanvasTileView.prototype.render = function() {
  var ctx = this.ctx;

  this.profiler.start('render');
  var BACKBUFFER = true;
  if(BACKBUFFER) {
      this.renderer.render(this.backCtx, this.tile.geometry(), this.tile.zoom, this.shader);
      this.ctx.drawImage(this.backCanvas, 0, 0);
  } else {
    this.renderer.render(ctx, this.tile.geometry(), this.tile.zoom, null);
  }

  this.stats.rendering_time = this.profiler.end();
}


//========================================
// Map view
// manages the list of tiles
//========================================
function CanvasMapView() {
  this.tile_views = {};
}

CanvasMapView.prototype.add = function(canvasview) {
  this.tile_views[canvasview.id] = canvasview;
}

CanvasMapView.prototype.getByElement = function(el) {
  return this.tile_views[el.getAttribute('id')];
}



