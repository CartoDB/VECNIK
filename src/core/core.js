
var Core = module.exports = {};

Core.load = function(url, callback) {
  var req = new XMLHttpRequest();
  req.onreadystatechange = function() {
    if (req.readyState === 4) {
      if (req.status === 200) {
        callback(JSON.parse(req.responseText));
      }
      // TODO: add error handling
    }
  };

  req.open('GET', url, true);
  req.send(null);
  return req;
};

// TODO: make this configurable
Core.ID_COLUMN = 'cartodb_id';