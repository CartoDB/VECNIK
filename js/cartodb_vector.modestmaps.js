var MM = com.modestmaps;

//========================================
// testing provider with mapbox tile layer
//========================================
function TileManagerMapBox() {
}
TileManagerMapBox.prototype = new TileManager();
TileManagerMapBox.prototype.url = function(coordinates) {
    return 'http://b.tiles.mapbox.com/v3/mapbox.mapbox-streets/' + coordinates.zoom + '/' + coordinates.row + '/' + coordinates.column + ".png";
}


//========================================
// Canvas provider
//========================================
function CanvasProvider(dataSource, tileSize) {
  this.tileSize = tileSize || new MM.Point(256, 256)
  this.tiles = new TileManager(dataSource)
  this.views = new CanvasMapView();
  //TileManagerMapBox();
}

CanvasProvider.prototype.getTile = function(coord) {
    var tile = this.tiles.add(coord);
    var canvas = new CanvasTileView(tile);
    this.views.add(canvas);
    return canvas.el;
    var div = document.createElement('div');
    div.innerHTML = 'test';
    return div;
}

CanvasProvider.prototype.releaseTile = function(coordinates) { 
  //this.tiles.destroy(coordinates);
}


MM.extend(CanvasProvider, MM.MapProvider);

