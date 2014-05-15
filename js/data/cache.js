
Vecnik.Cache = function() {};

var proto = Vecnik.Cache.prototype;

proto.time = new Date();

proto.data = {};

proto.add = function(data, key) {
  this.data[key] = { data:data, time:Date.now() };
};

proto.get = function(key) {
  return this.data[key] && this.data[key].data;
};

proto.purge = function() {
  this.time.setMinutes(this.time.getMinutes()-5);
  for (var key in this.data) {
    if (this.data[key].time < this.time) {
      delete this.data[key];
    }
  }
};
