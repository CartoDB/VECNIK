
var Core = module.exports = {};

Core.loadJSON = function(url, successHandler, errorHandler) {
  var xhr = new XMLHttpRequest();

  xhr.onreadystatechange = function() {
    if (xhr.readyState !== 4) {
      return;
    }

    if (!xhr.status || xhr.status < 200 || xhr.status > 299) {
      if (errorHandler) {
        errorHandler(xhr);
      }
      return;
    }

    if (!successHandler) {
      return;
    }

    var json;

    try {
      json = JSON.parse(xhr.responseText);
    } catch (ex) {
      console.error('Invalid JSON resource:\n'+ url);
      if (errorHandler) {
        errorHandler(ex);
      }
      return;
    }

    successHandler(json);
  };

  xhr.open('GET', url, true);
  xhr.send(null);
  return xhr;
};

// TODO: make this configurable
Core.ID_COLUMN = 'cartodb_id';