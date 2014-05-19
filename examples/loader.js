var baseUrl = location.protocol +'//'+ location.host + location.pathname.replace(/[^\/]+$/, '') + '../';

function loadFile(url) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', baseUrl + url, false);
  xhr.send(null);

  var s = xhr.status;
  if (s !== 0 && s !== 200 && s !== 1223) {
    var err = Error(xhr.status +' failed to load '+ baseUrl + url);
    err.status = xhr.status;
    err.responseText = xhr.responseText;
    throw err;
  }

  return xhr.responseText;
}

// eval(loadFile('files.js'));

var files = [
  'src/core.js',
  'src/settings.js',
  'src/mercator.js',
  'src/geometry.js',
  'src/model.js',
  'src/renderer.js',
  'src/shader.js',
  'src/cartodb.sql.js',
  'src/cartodb.provider.js',

  'examples/lib/underscore.js',
  'examples/lib/carto.js',

  'src/carto.js'
];

var str, js = '';
for (var i = 0; i < files.length; i++) {
  try {
    eval(loadFile(files[i]));
  } catch (ex) {
    console.error(files[i] +':\n\n'+ ex);
  }
}
