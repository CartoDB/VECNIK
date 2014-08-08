
var Core = module.exports = {};

Core.load = function(url, type, onSuccess, onError) {
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

  xhr.responseType = type;
  xhr.open('GET', url, true);
  xhr.send(null);
  return xhr;
};

// TODO: make this configurable
Core.ID_COLUMN = 'cartodb_id';