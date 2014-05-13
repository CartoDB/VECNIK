var TILE_SIZE = 256;

function bound(value, opt_min, opt_max) {
    if (opt_min != null) value = Math.max(value, opt_min);
    if (opt_max != null) value = Math.min(value, opt_max);
    return value;
}

function degreesToRadians(deg) {
    return deg * (Math.PI / 180);
}

function radiansToDegrees(rad) {
    return rad / (Math.PI / 180);
}

function MercatorProjection() {
    this.pixelOrigin_ = new Point(TILE_SIZE / 2, TILE_SIZE / 2);
    this.pixelsPerLonDegree_ = TILE_SIZE / 360;
    this.pixelsPerLonRadian_ = TILE_SIZE / (2 * Math.PI);
}


MercatorProjection.prototype.tileBBox = function(x, y, zoom) {
    var numTiles = 1 << zoom;
    var inc = TILE_SIZE/numTiles;
    var px = x*TILE_SIZE/numTiles;
    var py = y*TILE_SIZE/numTiles;
    return [
        this.fromPointToLatLng(new Point(px, py + inc)),
        this.fromPointToLatLng(new Point(px + inc, py))
    ];
};

MercatorProjection.prototype.tilePoint = function(x, y, zoom) {
        var px = x*TILE_SIZE;
        var py = y*TILE_SIZE;
        return [px, py];
};

MercatorProjection.prototype.latLngToTilePoint = function(latLng, x, y, zoom) {
    var numTiles = 1 << zoom;
    var projection = this;
    var worldCoordinate = projection.fromLatLngToPoint(latLng);
    var pixelCoordinate = new Point(
            worldCoordinate.x * numTiles,
            worldCoordinate.y * numTiles);
    var tp = this.tilePoint(x, y, zoom);
    return new Point(
            Math.floor(pixelCoordinate.x - tp[0]),
            Math.floor(pixelCoordinate.y - tp[1]));
};

MercatorProjection.prototype.latLngToTile = function(latLng, zoom) {
    var numTiles = 1 << zoom;
    var projection = this;
    var worldCoordinate = projection.fromLatLngToPoint(latLng);
    var pixelCoordinate = new Point(
            worldCoordinate.x * numTiles,
            worldCoordinate.y * numTiles);
    return new Point(
            Math.floor(pixelCoordinate.x / TILE_SIZE),
            Math.floor(pixelCoordinate.y / TILE_SIZE));
};
