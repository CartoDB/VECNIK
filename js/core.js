
// base events
function Event() {}
Event.prototype.on = function(evt, callback) { 
    var cb = this.callbacks = this.callbacks || {};
    var l = cb[evt] || (cb[evt] = []);
    l.push(callback);
};

Event.prototype.emit = function(evt) {
    var c = this.callbacks && this.callbacks[evt];
    for(var i = 0; c && i < c.length; ++i) {
        c[i].apply(this, Array.prototype.slice.call(arguments, 1));
    }
};


function get(url, callback) {
  var mygetrequest= new XMLHttpRequest();
  mygetrequest.onreadystatechange=function() {
    if (mygetrequest.readyState == 4){
      if (mygetrequest.status == 200){
        callback(JSON.parse(mygetrequest.responseText));
      }
      else {
        //error
      }
    }
  }
  mygetrequest.open("GET", url, true)
  mygetrequest.send(null)
}

//========================================
// model^2 
//========================================
function Model() {
  this.data = null;
}
Model.prototype = new Event();
Model.prototype.set = function(data) {
  console.log('data arrived');
  this.data = data;
  this.emit('change', data);
}

Model.prototype.destroy = function() {
  this.emit('destroy');
  delete this.data;
}
/*Model.prototype.sync = function() {
                theLayer.tiles[tile.id] = tile;
  if(Model.requestManager === undefined) {
    Model.requestManager = new MM.RequestManager();
    Model.requestManager.addCallback('requestcomplete', function(manager, tile) {
                // cache the tile itself:
    };
//this.requestManager.requestTile(key, coord, url);
  }*/
