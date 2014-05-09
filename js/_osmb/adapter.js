function setOrigin(origin) {
  ORIGIN_X = origin.x;
  ORIGIN_Y = origin.y;
}

function setSize(size) {
  WIDTH  = size.w;
  HEIGHT = size.h;
  CENTER_X = WIDTH /2 <<0;
  CENTER_Y = HEIGHT/2 <<0;
  Canvas.setSize(WIDTH, HEIGHT);
}

function setZoom(z) {
  MAP_SIZE = TILE_SIZE <<z;
}

function onResize(e) {
  setSize(e.width, e.height);
  Data.update();
}

function onMoveEnd(e) {
  Data.update();
}

function onZoomEnd(e) {
  setZoom(e.zoom);
  Data.update();
}
