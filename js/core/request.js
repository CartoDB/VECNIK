
Vecnik.Request = function() {};

var proto = Vecnik.Request.prototype = new Vecnik.Event();

proto.urlParam = function(url, param) {
  return url.replace(/\{ *([\w_]+) *\}/g, function(tag, key) {
    return param[key] || tag;
  });
};

proto.get = function(url) {
  var req = 'XDomainRequest' in window ? new XDomainRequest() : new XMLHttpRequest();

  function setState(state) {
    if ('XDomainRequest' in window && state !== req.readyState) {
      req.readyState = state;
      if (req.onreadystatechange) {
        req.onreadystatechange();
      }
    }
  }

  req.onerror = function() {
    req.status = 500;
    req.statusText = 'Error';
    setState(4);
  };

  req.ontimeout = function() {
    req.status = 408;
    req.statusText = 'Timeout';
    setState(4);
  };

  req.onprogress = function() {
    setState(3);
  };

  req.onload = function() {
    req.status = 200;
    req.statusText = 'Ok';
    setState(4);
  };

  req.onreadystatechange = function() {
    if (req.readyState !== 4) {
      return;
    }
    if (!req.status || req.status < 200 || req.status > 299) {
      this.emit('error', { status:req.status, text:req.statusText });
      return;
    }

    this.emit('error', req.responseText ? JSON.parse(req.responseText) : req.responseText);
  };

  setState(0);
  req.open('GET', url);
  setState(1);
  req.send(null);
  setState(2);

  return req;
};
