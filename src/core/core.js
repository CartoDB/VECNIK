
var Core = module.exports = {};

Core.loadJSON = function(url, onSuccess, onError) {
  var xhr = new XMLHttpRequest();

  xhr.onreadystatechange = function() {
    if (xhr.readyState !== 4) {
      return;
    }

    if (!xhr.status || xhr.status < 200 || xhr.status > 299) {
      if (onError) {
        onError(xhr);
      }
      return;
    }

    if (onSuccess) {
      try {
        onSuccess(JSON.parse(xhr.responseText));
      } catch(ex) {};
    }
  };

  xhr.open('GET', url, true);
  xhr.send(null);
  return xhr;
};

// TODO: check this with MSIE and Firefox
Core.loadBinary = function(url, onSuccess, onError) {
  var xhr = new XMLHttpRequest();

  xhr.onreadystatechange = function() {
    if (xhr.readyState !== 4) {
      return;
    }

    if (!xhr.status || xhr.status < 200 || xhr.status > 299) {
      if (onError) {
        onError(xhr);
      }
      return;
    }

    if (onSuccess) {
      onSuccess(xhr.response);
    }
  };

  xhr.responseType = 'arraybuffer';
  xhr.open('GET', url, true);
  xhr.send(null);
  return xhr;
};

Core._images = {};
Core._imagesLoading = {};

Core.loadImage = function(url, onSuccess) {
  var
    images = this._images,
    img;

  if ((img = images[url])) {
    if (onSuccess) {
      onSuccess(img);
    }
    return;
  }

  if (this._imagesLoading[url]) {
    this._imagesLoading[url].push(onSuccess);
    return;
  }

  this._imagesLoading[url] = [onSuccess];

  img = new Image();
  var self = this;
  img.onload = function() {
    images[url] = this;
    var callbacks = self._imagesLoading[url];
    for (var i = 0, il = callbacks.length; i < il; i++) {
      callbacks[i](this);
    }
    delete self._imagesLoading[url];
  };

  img.src = url;
};
