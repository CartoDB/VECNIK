var State = {

  _data: {},

  set: function(key, value) {
    this._data[key] = value;
    this.save();
  },

  get: function(key) {
    return this._data[key];
  },

  save: function() {
    var key, value, param = [];
    for (key in this._data) {
      value = this._data[key];
      param.push(encodeURIComponent(key) +'='+ encodeURIComponent(value));
    }
    location.hash = '#'+ param.join('&');
  },

  load: function() {
    var
      hash = location.hash.replace(/^#/, ''),
      self = this;

    hash = hash.replace(/\&?([^\&=]+)=([^\&=]*)/g, function ($0, $1, $2) {
      if ($1) {
        self._data[decodeURIComponent($1)] = decodeURIComponent($2);
      }
    });
  },

  init: function(data) {
    if (data) {
      for (key in data) {
        this._data[key] = data[key];
      }
    }
    this.load();
    this.save();
  }
};
