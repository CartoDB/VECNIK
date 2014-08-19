
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
