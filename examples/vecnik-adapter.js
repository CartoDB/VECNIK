/***
 *
 * This is just a very basic CartoDB framework mock up in order to demo Vecnik integration
 *
 **/

var JSONP = function(global) {
  // (C) WebReflection Essential - Mit Style
	// 216 bytes minified + gzipped via Google Closure Compiler
  function JSONP(uri, callback) {
    function JSONPResponse() {
      delete global[src];
      documentElement.removeChild(script);
      callback.apply(this, arguments);
    }
    var
      src = prefix + id++,
      script = document.createElement("script");
      global[src] = JSONPResponse;
      documentElement.insertBefore(
        script,
        documentElement.lastChild
      ).src = uri + "=" + src;
  }
  var
    id = 0,
    prefix = "__JSONP__",
    document = global.document,
    documentElement = document.documentElement;
  return JSONP;
}(this);

function addTileLayer(options) {
  return new L.TileLayer(options.urlTemplate, {
    subdomains: '1234',
    attribution: options.attribution,
    maxZoom: 20
  });
}

function addVecnikLayer(options) {
  var layerOptions = options.layer_definition.layers[0].options;
  var sql = layerOptions.sql;
  var table = sql.replace(/^.+\sFROM\s+/i, '');

// console.log(table);

  var provider = new VECNIK.CartoDB.API(VECNIK.GeoJSON, {
    user: options.user_name,
    table: table,
    columns: ['*'],
    debug: false,
    bufferSize: 50
  });

  var cartocss = layerOptions.cartocss;

// console.log(cartocss);

  var shader = new VECNIK.CartoShader(cartocss);

  var layer = new VECNIK.Layer({
    provider: provider,
    renderer: new VECNIK.Renderer({ shader: shader }),
    interaction: true,
    detectRetina: true
  })
  .on('featureEnter', function(e) {
    tooltip.style.display = 'block';
    var innerHTML = '';
    for (var key in e.feature) {
      innerHTML += '<div class="property"><span class="key">'+ key +'</span>'+ e.feature[key] +'</div>';
    }
    tooltip.innerHTML  = innerHTML;
    tooltip.style.left = (e.x+10) +'px';
    tooltip.style.top  = (e.y+10) +'px';
  })
  .on('featureOver', function(e) {
    tooltip.style.left = (e.x+10) +'px';
    tooltip.style.top  = (e.y+10) +'px';
  })
  .on('featureOut', function(e) {
    tooltip.style.display = 'none';
  });

  return layer;
}

function initVecnikAdapter(containerId, vizUrl, refMap) {
  var map = new L.Map(containerId);

  JSONP(vizUrl +'?callback', function(viz) {
    eval('var center='+ viz.center);

// console.log(viz);

    map.setView(center, viz.zoom-1);

    var layer;
    for (var i = 0; i < viz.layers.length; i++) {
      layer = viz.layers[i];

      if (layer.type === 'tiled') {
        addTileLayer(layer.options).addTo(map);
      }

      if (layer.type === 'layergroup') {
        addVecnikLayer(layer.options).addTo(map);
      }
    }

    setTimeout(function() {
      map.setView(refMap.get('center'), refMap.get('zoom'));
    }, 250);

    refMap.on('change:zoom change:center', function(e) {
      map.setView(refMap.get('center'), refMap.get('zoom'));
    });

//    map.on('zoom move', function(e) {
//      refMap.set({
//        center: map.getCenter(),
//        zoom: map.getZoom()
//      });
//    });
  });

  return map;
}
