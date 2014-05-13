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

var module = {}; // fix missing module environment in browser
eval(loadFile('Gruntfile.js'));

var str, js = '';
for (var i = 0; i < srcFiles.length; i++) {
  try {
    eval(loadFile(srcFiles[i]));
  } catch (ex) {
    console.error(srcFiles[i] +':\n\n'+ ex);
  }

  //js += '//****** file: '+ srcFiles[i] +' ******\n\n';
  //js += str +'\n\n';
}

//try {
//  eval(js);
//} catch (ex) {
//  console.error(ex);
//}
